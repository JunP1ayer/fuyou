#!/usr/bin/env python3
"""
Core optimizer service for shift optimization algorithms.
"""

import asyncio
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import traceback

import numpy as np
import pandas as pd
from loguru import logger

from models.optimization_models import (
    OptimizationRequest,
    OptimizationResponse,
    OptimizationSolution,
    SuggestedShift,
    AlgorithmType,
    ObjectiveType,
    ConstraintType,
    OptimizationStatus,
    OptimizationMetrics
)
from algorithms.linear_programming import LinearProgrammingOptimizer
from algorithms.genetic_algorithm import GeneticAlgorithmOptimizer
from algorithms.multi_objective import MultiObjectiveOptimizer
from utils.config import get_settings


class ShiftOptimizer:
    """Main optimizer class that coordinates different optimization algorithms."""
    
    def __init__(self):
        self.settings = get_settings()
        self.active_runs: Dict[str, OptimizationStatus] = {}
        self.completed_runs: Dict[str, OptimizationResponse] = {}
        self.metrics = OptimizationMetrics()
        
        # Initialize algorithm implementations
        self.linear_optimizer = LinearProgrammingOptimizer()
        self.genetic_optimizer = GeneticAlgorithmOptimizer()
        self.multi_objective_optimizer = MultiObjectiveOptimizer()
        
        logger.info("ShiftOptimizer initialized successfully")
    
    async def optimize(self, request: OptimizationRequest) -> OptimizationResponse:
        """
        Main optimization method that routes to appropriate algorithm.
        """
        start_time = time.time()
        run_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Starting optimization {run_id} for user {request.user_id}")
            
            # Update metrics
            self.metrics.total_requests += 1
            
            # Validate request
            self._validate_request(request)
            
            # Select and execute algorithm
            solution = await self._execute_algorithm(request)
            
            # Create response
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            response = OptimizationResponse(
                success=True,
                optimization_run_id=run_id,
                solution=solution,
                processing_time_ms=processing_time_ms
            )
            
            # Update metrics
            self.metrics.successful_requests += 1
            self.metrics.average_processing_time_ms = (
                (self.metrics.average_processing_time_ms * (self.metrics.total_requests - 1) + processing_time_ms) /
                self.metrics.total_requests
            )
            
            algorithm_key = request.preferences.algorithm.value
            self.metrics.algorithm_usage[algorithm_key] = self.metrics.algorithm_usage.get(algorithm_key, 0) + 1
            
            logger.info(f"Optimization {run_id} completed successfully in {processing_time_ms}ms")
            return response
            
        except Exception as e:
            logger.error(f"Optimization {run_id} failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Update metrics
            self.metrics.failed_requests += 1
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return OptimizationResponse(
                success=False,
                optimization_run_id=run_id,
                error=str(e),
                processing_time_ms=processing_time_ms
            )
    
    async def _execute_algorithm(self, request: OptimizationRequest) -> OptimizationSolution:
        """Execute the appropriate optimization algorithm."""
        algorithm = request.preferences.algorithm
        
        if algorithm == AlgorithmType.LINEAR_PROGRAMMING:
            return await self._execute_linear_programming(request)
        elif algorithm == AlgorithmType.GENETIC_ALGORITHM:
            return await self._execute_genetic_algorithm(request)
        elif algorithm == AlgorithmType.MULTI_OBJECTIVE_NSGA2:
            return await self._execute_multi_objective(request)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    async def _execute_linear_programming(self, request: OptimizationRequest) -> OptimizationSolution:
        """Execute linear programming optimization."""
        logger.info("Executing linear programming optimization")
        
        start_time = time.time()
        
        # Extract problem data
        problem_data = self._extract_problem_data(request)
        
        # Execute optimization
        result = await self.linear_optimizer.optimize(
            problem_data,
            request.objective,
            request.constraints,
            request.preferences
        )
        
        # Convert result to solution format
        solution = self._convert_to_solution(
            result,
            request,
            AlgorithmType.LINEAR_PROGRAMMING,
            int((time.time() - start_time) * 1000)
        )
        
        logger.info(f"Linear programming optimization completed with objective value: {solution.objective_value}")
        return solution
    
    async def _execute_genetic_algorithm(self, request: OptimizationRequest) -> OptimizationSolution:
        """Execute genetic algorithm optimization."""
        logger.info("Executing genetic algorithm optimization")
        
        start_time = time.time()
        
        # Extract problem data
        problem_data = self._extract_problem_data(request)
        
        # Execute optimization
        result = await self.genetic_optimizer.optimize(
            problem_data,
            request.objective,
            request.constraints,
            request.preferences
        )
        
        # Convert result to solution format
        solution = self._convert_to_solution(
            result,
            request,
            AlgorithmType.GENETIC_ALGORITHM,
            int((time.time() - start_time) * 1000)
        )
        
        logger.info(f"Genetic algorithm optimization completed with objective value: {solution.objective_value}")
        return solution
    
    async def _execute_multi_objective(self, request: OptimizationRequest) -> OptimizationSolution:
        """Execute multi-objective optimization."""
        logger.info("Executing multi-objective optimization")
        
        start_time = time.time()
        
        # Extract problem data
        problem_data = self._extract_problem_data(request)
        
        # Execute optimization
        result = await self.multi_objective_optimizer.optimize(
            problem_data,
            request.objective,
            request.constraints,
            request.preferences
        )
        
        # Convert result to solution format
        solution = self._convert_to_solution(
            result,
            request,
            AlgorithmType.MULTI_OBJECTIVE_NSGA2,
            int((time.time() - start_time) * 1000)
        )
        
        logger.info(f"Multi-objective optimization completed with objective value: {solution.objective_value}")
        return solution
    
    def _extract_problem_data(self, request: OptimizationRequest) -> Dict[str, Any]:
        """Extract and structure problem data for optimization algorithms."""
        start_date = datetime.fromisoformat(request.time_range['start'].replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(request.time_range['end'].replace('Z', '+00:00')).date()
        
        # Generate date range
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Create job source mapping
        job_sources = {js.id: js for js in request.job_sources}
        
        # Create availability matrix
        availability_matrix = self._create_availability_matrix(
            date_range,
            request.availability
        )
        
        # Extract constraints
        constraints_dict = {c.constraint_type: c for c in request.constraints}
        
        return {
            'date_range': date_range,
            'job_sources': job_sources,
            'existing_shifts': request.existing_shifts,
            'availability_matrix': availability_matrix,
            'constraints': constraints_dict,
            'objective': request.objective,
            'user_id': request.user_id
        }
    
    def _create_availability_matrix(self, date_range: pd.DatetimeIndex, availability: List) -> pd.DataFrame:
        """Create availability matrix for optimization."""
        # Create a matrix of availability for each date and time slot
        # This is a simplified version - in practice, you'd create detailed time slots
        
        availability_data = []
        
        for date in date_range:
            day_of_week = date.dayofweek
            # Convert to match our model (0=Sunday, 6=Saturday)
            day_of_week = (day_of_week + 1) % 7
            
            # Find applicable availability slots
            day_slots = [slot for slot in availability if slot.day_of_week == day_of_week]
            
            # For simplicity, assume 24 hourly slots
            for hour in range(24):
                is_available = any(
                    self._time_in_slot(f"{hour:02d}:00", slot.start_time, slot.end_time)
                    for slot in day_slots
                    if slot.is_available
                )
                
                availability_data.append({
                    'date': date.date(),
                    'hour': hour,
                    'available': is_available
                })
        
        return pd.DataFrame(availability_data)
    
    def _time_in_slot(self, time_str: str, start_time: str, end_time: str) -> bool:
        """Check if a time is within a time slot."""
        try:
            time_minutes = self._time_to_minutes(time_str)
            start_minutes = self._time_to_minutes(start_time)
            end_minutes = self._time_to_minutes(end_time)
            
            return start_minutes <= time_minutes <= end_minutes
        except:
            return False
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string to minutes since midnight."""
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    def _convert_to_solution(
        self,
        result: Dict[str, Any],
        request: OptimizationRequest,
        algorithm: AlgorithmType,
        execution_time_ms: int
    ) -> OptimizationSolution:
        """Convert optimization result to solution format."""
        
        # Extract suggested shifts from result
        suggested_shifts = []
        total_income = 0
        total_hours = 0
        job_source_distribution = {}
        
        for shift_data in result.get('shifts', []):
            shift = SuggestedShift(
                id=str(uuid.uuid4()),
                job_source_id=shift_data.get('job_source_id'),
                job_source_name=shift_data.get('job_source_name', ''),
                date=shift_data.get('date'),
                start_time=shift_data.get('start_time'),
                end_time=shift_data.get('end_time'),
                hourly_rate=shift_data.get('hourly_rate'),
                break_minutes=shift_data.get('break_minutes', 0),
                working_hours=shift_data.get('working_hours'),
                calculated_earnings=shift_data.get('calculated_earnings'),
                confidence=shift_data.get('confidence', 0.8),
                priority=shift_data.get('priority', 1),
                reasoning=shift_data.get('reasoning', 'Optimized for maximum benefit'),
                is_original=shift_data.get('is_original', False)
            )
            
            suggested_shifts.append(shift)
            total_income += shift.calculated_earnings
            total_hours += shift.working_hours
            
            # Update job source distribution
            js_name = shift.job_source_name
            job_source_distribution[js_name] = job_source_distribution.get(js_name, 0) + 1
        
        # Check constraint satisfaction
        constraints_satisfied = {}
        for constraint in request.constraints:
            constraints_satisfied[constraint.constraint_type.value] = self._check_constraint_satisfaction(
                constraint,
                suggested_shifts,
                total_income,
                total_hours
            )
        
        return OptimizationSolution(
            suggested_shifts=suggested_shifts,
            objective_value=result.get('objective_value', 0),
            constraints_satisfied=constraints_satisfied,
            algorithm_used=algorithm,
            execution_time_ms=execution_time_ms,
            confidence_score=result.get('confidence_score', 0.8),
            metadata=result.get('metadata', {}),
            total_income=total_income,
            total_hours=total_hours,
            total_shifts=len(suggested_shifts),
            job_source_distribution=job_source_distribution
        )
    
    def _check_constraint_satisfaction(
        self,
        constraint,
        shifts: List[SuggestedShift],
        total_income: float,
        total_hours: float
    ) -> bool:
        """Check if a constraint is satisfied by the solution."""
        
        if constraint.constraint_type == ConstraintType.FUYOU_LIMIT:
            return total_income <= constraint.constraint_value
        elif constraint.constraint_type == ConstraintType.WEEKLY_HOURS:
            # Calculate max weekly hours (simplified)
            max_weekly_hours = max(
                sum(shift.working_hours for shift in shifts 
                    if shift.date.isocalendar()[1] == week)
                for week in set(shift.date.isocalendar()[1] for shift in shifts)
            ) if shifts else 0
            return max_weekly_hours <= constraint.constraint_value
        elif constraint.constraint_type == ConstraintType.DAILY_HOURS:
            # Calculate max daily hours
            max_daily_hours = max(
                sum(shift.working_hours for shift in shifts if shift.date == date)
                for date in set(shift.date for shift in shifts)
            ) if shifts else 0
            return max_daily_hours <= constraint.constraint_value
        
        return True
    
    def _validate_request(self, request: OptimizationRequest) -> None:
        """Validate optimization request."""
        if not request.job_sources:
            raise ValueError("At least one job source is required")
        
        if not request.constraints:
            raise ValueError("At least one constraint is required")
        
        # Check tier limits
        # This would integrate with the tier system
        pass
    
    async def get_run_status(self, run_id: str) -> Optional[OptimizationStatus]:
        """Get the status of an optimization run."""
        return self.active_runs.get(run_id)
    
    async def update_run_status(
        self,
        run_id: str,
        status: str,
        progress: float,
        message: str
    ) -> None:
        """Update the status of an optimization run."""
        self.active_runs[run_id] = OptimizationStatus(
            run_id=run_id,
            status=status,
            progress=progress,
            message=message,
            estimated_completion=datetime.now() + timedelta(minutes=5) if status == "running" else None
        )
    
    async def store_result(self, run_id: str, result: OptimizationResponse) -> None:
        """Store optimization result."""
        self.completed_runs[run_id] = result
        
        # Remove from active runs
        if run_id in self.active_runs:
            del self.active_runs[run_id]
    
    async def get_metrics(self) -> str:
        """Get optimization metrics in Prometheus format."""
        metrics = []
        
        metrics.append(f"optimization_total_requests {self.metrics.total_requests}")
        metrics.append(f"optimization_successful_requests {self.metrics.successful_requests}")
        metrics.append(f"optimization_failed_requests {self.metrics.failed_requests}")
        metrics.append(f"optimization_average_processing_time_ms {self.metrics.average_processing_time_ms}")
        metrics.append(f"optimization_success_rate {self.metrics.success_rate}")
        
        for algorithm, count in self.metrics.algorithm_usage.items():
            metrics.append(f"optimization_algorithm_usage{{algorithm=\"{algorithm}\"}} {count}")
        
        return "\n".join(metrics)
    
    async def cleanup(self) -> None:
        """Cleanup optimizer resources."""
        logger.info("Cleaning up optimizer resources")
        
        # Cancel any active runs
        for run_id in list(self.active_runs.keys()):
            await self.update_run_status(run_id, "cancelled", 0.0, "Service shutdown")
        
        # Clear data
        self.active_runs.clear()
        self.completed_runs.clear()
        
        logger.info("Optimizer cleanup completed")