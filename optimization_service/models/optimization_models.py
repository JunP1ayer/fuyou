#!/usr/bin/env python3
"""
Pydantic models for optimization requests and responses.
"""

from datetime import datetime, date
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field, validator


class ConstraintType(str, Enum):
    """Types of optimization constraints."""
    FUYOU_LIMIT = "fuyou_limit"
    WEEKLY_HOURS = "weekly_hours"
    DAILY_HOURS = "daily_hours"
    AVAILABILITY = "availability"
    JOB_SOURCE_LIMIT = "job_source_limit"
    MINIMUM_INCOME = "minimum_income"
    BREAK_CONSTRAINTS = "break_constraints"


class ConstraintUnit(str, Enum):
    """Units for constraint values."""
    YEN = "yen"
    HOURS = "hours"
    MINUTES = "minutes"
    DAYS = "days"
    SHIFTS = "shifts"
    PERCENTAGE = "percentage"


class ObjectiveType(str, Enum):
    """Types of optimization objectives."""
    MAXIMIZE_INCOME = "maximize_income"
    MINIMIZE_HOURS = "minimize_hours"
    BALANCE_SOURCES = "balance_sources"
    MULTI_OBJECTIVE = "multi_objective"


class AlgorithmType(str, Enum):
    """Types of optimization algorithms."""
    LINEAR_PROGRAMMING = "linear_programming"
    GENETIC_ALGORITHM = "genetic_algorithm"
    SIMULATED_ANNEALING = "simulated_annealing"
    MULTI_OBJECTIVE_NSGA2 = "multi_objective_nsga2"


class TierLevel(str, Enum):
    """Subscription tier levels."""
    FREE = "free"
    STANDARD = "standard"
    PRO = "pro"


class ConstraintModel(BaseModel):
    """Model for optimization constraints."""
    constraint_type: ConstraintType
    constraint_value: float = Field(gt=0, description="Constraint value (must be positive)")
    constraint_unit: ConstraintUnit
    priority: int = Field(ge=1, le=3, default=1, description="1=hard, 2=soft, 3=nice-to-have")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class JobSourceModel(BaseModel):
    """Model for job sources."""
    id: str
    name: str
    hourly_rate: float = Field(gt=0, description="Hourly rate in yen")
    is_active: bool = True
    expected_monthly_hours: Optional[int] = None
    default_break_minutes: int = Field(ge=0, default=0)


class ExistingShiftModel(BaseModel):
    """Model for existing shifts."""
    date: date
    start_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    job_source_id: Optional[str] = None
    job_source_name: str
    is_confirmed: bool = False
    hourly_rate: float = Field(gt=0)
    break_minutes: int = Field(ge=0, default=0)


class AvailabilitySlotModel(BaseModel):
    """Model for availability slots."""
    day_of_week: int = Field(ge=0, le=6, description="0=Sunday, 6=Saturday")
    start_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    is_available: bool = True
    job_source_id: Optional[str] = None
    priority: int = Field(ge=1, le=3, default=1)


class OptimizationPreferences(BaseModel):
    """Model for optimization preferences."""
    algorithm: AlgorithmType = AlgorithmType.LINEAR_PROGRAMMING
    max_iterations: Optional[int] = Field(None, gt=0)
    timeout: Optional[int] = Field(None, gt=0, description="Timeout in seconds")
    convergence_threshold: Optional[float] = Field(None, gt=0)
    enable_parallel: bool = True
    random_seed: Optional[int] = None


class OptimizationRequest(BaseModel):
    """Model for optimization requests."""
    user_id: str
    objective: ObjectiveType
    time_range: Dict[str, str] = Field(description="start and end dates")
    constraints: List[ConstraintModel]
    job_sources: List[JobSourceModel]
    existing_shifts: List[ExistingShiftModel] = Field(default_factory=list)
    availability: List[AvailabilitySlotModel] = Field(default_factory=list)
    preferences: OptimizationPreferences = Field(default_factory=OptimizationPreferences)
    tier_level: TierLevel = TierLevel.FREE
    
    @validator('time_range')
    def validate_time_range(cls, v):
        """Validate time range has start and end dates."""
        if 'start' not in v or 'end' not in v:
            raise ValueError('time_range must contain start and end dates')
        
        try:
            start_date = datetime.fromisoformat(v['start'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(v['end'].replace('Z', '+00:00'))
            
            if start_date >= end_date:
                raise ValueError('start date must be before end date')
                
            # Check time range is not too long (max 1 year)
            if (end_date - start_date).days > 365:
                raise ValueError('time range cannot exceed 365 days')
                
        except ValueError as e:
            raise ValueError(f'Invalid date format: {e}')
        
        return v
    
    @validator('constraints')
    def validate_constraints(cls, v):
        """Validate constraints are reasonable."""
        if not v:
            raise ValueError('At least one constraint is required')
        
        # Check for duplicate constraint types
        constraint_types = [c.constraint_type for c in v]
        if len(constraint_types) != len(set(constraint_types)):
            raise ValueError('Duplicate constraint types are not allowed')
        
        return v


class SuggestedShift(BaseModel):
    """Model for suggested shifts."""
    id: str
    job_source_id: Optional[str] = None
    job_source_name: str
    date: date
    start_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: str = Field(pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hourly_rate: float = Field(gt=0)
    break_minutes: int = Field(ge=0, default=0)
    working_hours: float = Field(gt=0)
    calculated_earnings: float = Field(gt=0)
    confidence: float = Field(ge=0, le=1, description="Confidence in this suggestion")
    priority: int = Field(ge=1, le=3, default=1)
    reasoning: str = Field(description="Explanation for why this shift is suggested")
    is_original: bool = Field(default=False, description="True if this is an existing shift")


class OptimizationSolution(BaseModel):
    """Model for optimization solutions."""
    suggested_shifts: List[SuggestedShift]
    objective_value: float
    constraints_satisfied: Dict[str, bool]
    algorithm_used: AlgorithmType
    execution_time_ms: int = Field(ge=0)
    confidence_score: float = Field(ge=0, le=1)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Additional metrics
    total_income: float = Field(ge=0)
    total_hours: float = Field(ge=0)
    total_shifts: int = Field(ge=0)
    job_source_distribution: Dict[str, int] = Field(default_factory=dict)
    
    @validator('suggested_shifts')
    def validate_suggested_shifts(cls, v):
        """Validate suggested shifts."""
        if not v:
            raise ValueError('At least one suggested shift is required')
        
        # Check for overlapping shifts
        shifts_by_date = {}
        for shift in v:
            date_str = shift.date.isoformat()
            if date_str not in shifts_by_date:
                shifts_by_date[date_str] = []
            shifts_by_date[date_str].append(shift)
        
        for date_str, shifts in shifts_by_date.items():
            shifts.sort(key=lambda s: s.start_time)
            for i in range(len(shifts) - 1):
                if shifts[i].end_time > shifts[i + 1].start_time:
                    raise ValueError(f'Overlapping shifts on {date_str}')
        
        return v


class OptimizationResponse(BaseModel):
    """Model for optimization responses."""
    success: bool
    optimization_run_id: str
    solution: Optional[OptimizationSolution] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    processing_time_ms: int = Field(ge=0)
    
    @validator('solution')
    def validate_solution(cls, v, values):
        """Validate solution is present when success is True."""
        if values.get('success') and not v:
            raise ValueError('Solution is required when success is True')
        return v


class ValidationResult(BaseModel):
    """Model for validation results."""
    is_valid: bool
    error_message: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    violations: List[Dict[str, Any]] = Field(default_factory=list)


class OptimizationMetrics(BaseModel):
    """Model for optimization metrics."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_processing_time_ms: float = 0
    algorithm_usage: Dict[str, int] = Field(default_factory=dict)
    constraint_violations: Dict[str, int] = Field(default_factory=dict)
    user_satisfaction_score: float = Field(ge=0, le=1, default=0)
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_requests == 0:
            return 0
        return self.successful_requests / self.total_requests
    
    @property
    def failure_rate(self) -> float:
        """Calculate failure rate."""
        if self.total_requests == 0:
            return 0
        return self.failed_requests / self.total_requests


class AlgorithmInfo(BaseModel):
    """Model for algorithm information."""
    id: AlgorithmType
    name: str
    description: str
    complexity: str = Field(description="low, medium, high")
    execution_time: str = Field(description="fast, medium, slow")
    suitable_for: List[ObjectiveType]
    tier_requirement: TierLevel
    parameters: Dict[str, Any] = Field(default_factory=dict)


class TierLimits(BaseModel):
    """Model for tier limits."""
    max_optimization_runs: int = Field(description="-1 for unlimited")
    available_algorithms: List[AlgorithmType]
    max_constraints: int = Field(description="-1 for unlimited")
    max_time_horizon: int = Field(description="Maximum days in optimization period")
    analytics_access: bool = False
    api_access: bool = False
    support_level: str = "basic"