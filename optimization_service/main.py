#!/usr/bin/env python3
"""
Phase 4: Python Optimization Service
Main FastAPI application for shift optimization algorithms.
"""

import os
import sys
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any
import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from loguru import logger
import httpx

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.optimization_models import (
    OptimizationRequest,
    OptimizationResponse,
    ConstraintModel,
    ObjectiveType,
    AlgorithmType
)
from services.optimizer import ShiftOptimizer
from services.constraint_manager import ConstraintManager
from services.solution_validator import SolutionValidator
from utils.config import get_settings
from utils.logger import setup_logger

# Initialize settings
settings = get_settings()

# Setup logging
setup_logger(settings.log_level)

# Global variables for service state
optimizer: Optional[ShiftOptimizer] = None
constraint_manager: Optional[ConstraintManager] = None
solution_validator: Optional[SolutionValidator] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    global optimizer, constraint_manager, solution_validator
    
    # Startup
    logger.info("🚀 Starting Optimization Service...")
    
    try:
        # Initialize core services
        optimizer = ShiftOptimizer()
        constraint_manager = ConstraintManager()
        solution_validator = SolutionValidator()
        
        logger.info("✅ Optimization service initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize optimization service: {e}")
        raise
    
    finally:
        # Shutdown
        logger.info("🛑 Shutting down Optimization Service...")
        
        # Cleanup resources
        if optimizer:
            await optimizer.cleanup()
        
        logger.info("✅ Optimization service shut down successfully")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Fuyou Optimization Service",
    description="Advanced shift optimization algorithms for fuyou dependency management",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    service: str = "optimization"


class OptimizationStatus(BaseModel):
    run_id: str
    status: str
    progress: float = Field(ge=0, le=1)
    message: str
    estimated_completion: Optional[datetime] = None


class ErrorResponse(BaseModel):
    error: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
    trace_id: Optional[str] = None


# Global request counter for tracing
_request_counter = 0


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time and trace ID to all responses."""
    global _request_counter
    _request_counter += 1
    
    trace_id = f"opt_{_request_counter}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    request.state.trace_id = trace_id
    
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Trace-ID"] = trace_id
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for all unhandled exceptions."""
    trace_id = getattr(request.state, 'trace_id', 'unknown')
    
    logger.error(f"Unhandled exception in {request.method} {request.url.path}: {exc}")
    logger.error(f"Trace ID: {trace_id}")
    logger.error(f"Exception traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred while processing your request",
            trace_id=trace_id
        ).dict()
    )


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return HealthResponse()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse()


@app.post("/optimize", response_model=OptimizationResponse)
async def optimize_shifts(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
) -> OptimizationResponse:
    """
    Main optimization endpoint.
    
    Accepts optimization requests and returns optimized shift schedules.
    """
    if not optimizer:
        raise HTTPException(
            status_code=503,
            detail="Optimization service not initialized"
        )
    
    try:
        logger.info(f"Processing optimization request for user {request.user_id}")
        logger.info(f"Objective: {request.objective}, Algorithm: {request.preferences.algorithm}")
        
        # Validate request
        validation_result = await constraint_manager.validate_request(request)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid optimization request: {validation_result.error_message}"
            )
        
        # Execute optimization
        result = await optimizer.optimize(request)
        
        # Validate solution
        if result.solution:
            validation = await solution_validator.validate_solution(
                result.solution,
                request.constraints
            )
            
            if not validation.is_valid:
                logger.warning(f"Solution validation failed: {validation.error_message}")
                # Continue with result but mark as low confidence
                result.solution.confidence_score *= 0.5
        
        logger.info(f"Optimization completed successfully for user {request.user_id}")
        logger.info(f"Objective value: {result.solution.objective_value if result.solution else 'N/A'}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Optimization failed: {e}")
        logger.error(f"Request details: {request.dict()}")
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}"
        )


@app.post("/optimize/async", response_model=OptimizationStatus)
async def optimize_shifts_async(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
) -> OptimizationStatus:
    """
    Asynchronous optimization endpoint.
    
    Starts optimization in background and returns status.
    """
    if not optimizer:
        raise HTTPException(
            status_code=503,
            detail="Optimization service not initialized"
        )
    
    try:
        # Generate run ID
        run_id = f"run_{request.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Start optimization in background
        background_tasks.add_task(
            _run_optimization_async,
            run_id,
            request
        )
        
        return OptimizationStatus(
            run_id=run_id,
            status="started",
            progress=0.0,
            message="Optimization started successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to start async optimization: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start optimization: {str(e)}"
        )


@app.get("/optimize/status/{run_id}", response_model=OptimizationStatus)
async def get_optimization_status(run_id: str) -> OptimizationStatus:
    """Get the status of an asynchronous optimization run."""
    if not optimizer:
        raise HTTPException(
            status_code=503,
            detail="Optimization service not initialized"
        )
    
    try:
        status = await optimizer.get_run_status(run_id)
        
        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization run {run_id} not found"
            )
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get optimization status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimization status: {str(e)}"
        )


@app.post("/validate/constraints")
async def validate_constraints(constraints: List[ConstraintModel]) -> Dict[str, Any]:
    """Validate optimization constraints."""
    if not constraint_manager:
        raise HTTPException(
            status_code=503,
            detail="Constraint manager not initialized"
        )
    
    try:
        validation_result = await constraint_manager.validate_constraints(constraints)
        
        return {
            "is_valid": validation_result.is_valid,
            "violations": validation_result.violations,
            "suggestions": validation_result.suggestions
        }
        
    except Exception as e:
        logger.error(f"Constraint validation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Constraint validation failed: {str(e)}"
        )


@app.get("/algorithms", response_model=List[Dict[str, Any]])
async def get_available_algorithms() -> List[Dict[str, Any]]:
    """Get list of available optimization algorithms."""
    algorithms = [
        {
            "id": AlgorithmType.LINEAR_PROGRAMMING,
            "name": "Linear Programming",
            "description": "Fast linear optimization suitable for most scenarios",
            "complexity": "low",
            "execution_time": "fast",
            "suitable_for": ["maximize_income", "minimize_hours"],
            "tier_requirement": "free"
        },
        {
            "id": AlgorithmType.GENETIC_ALGORITHM,
            "name": "Genetic Algorithm",
            "description": "Advanced evolutionary optimization for complex constraints",
            "complexity": "medium",
            "execution_time": "medium",
            "suitable_for": ["balance_sources", "multi_objective"],
            "tier_requirement": "standard"
        },
        {
            "id": AlgorithmType.SIMULATED_ANNEALING,
            "name": "Simulated Annealing",
            "description": "Probabilistic optimization for escaping local optima",
            "complexity": "medium",
            "execution_time": "medium",
            "suitable_for": ["complex_constraints"],
            "tier_requirement": "standard"
        },
        {
            "id": AlgorithmType.MULTI_OBJECTIVE_NSGA2,
            "name": "NSGA-II Multi-Objective",
            "description": "Advanced multi-objective optimization with Pareto solutions",
            "complexity": "high",
            "execution_time": "slow",
            "suitable_for": ["multi_objective"],
            "tier_requirement": "pro"
        }
    ]
    
    return algorithms


@app.get("/metrics")
async def get_metrics():
    """Get service metrics (Prometheus format)."""
    if not optimizer:
        raise HTTPException(
            status_code=503,
            detail="Optimization service not initialized"
        )
    
    try:
        metrics = await optimizer.get_metrics()
        return Response(
            content=metrics,
            media_type="text/plain"
        )
        
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get metrics: {str(e)}"
        )


async def _run_optimization_async(run_id: str, request: OptimizationRequest):
    """Background task for asynchronous optimization."""
    try:
        logger.info(f"Starting async optimization run {run_id}")
        
        # Update status
        await optimizer.update_run_status(run_id, "running", 0.1, "Initializing...")
        
        # Run optimization
        result = await optimizer.optimize(request)
        
        # Update status
        await optimizer.update_run_status(
            run_id,
            "completed",
            1.0,
            f"Optimization completed with objective value: {result.solution.objective_value if result.solution else 'N/A'}"
        )
        
        # Store result
        await optimizer.store_result(run_id, result)
        
        logger.info(f"Async optimization run {run_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Async optimization run {run_id} failed: {e}")
        await optimizer.update_run_status(
            run_id,
            "failed",
            0.0,
            f"Optimization failed: {str(e)}"
        )


if __name__ == "__main__":
    # Run with uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
        reload=settings.debug,
        workers=1 if settings.debug else 4
    )