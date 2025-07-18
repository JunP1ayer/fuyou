#!/usr/bin/env python3
"""
Constraint manager for optimization requests.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from loguru import logger

from models.optimization_models import (
    OptimizationRequest,
    ConstraintModel,
    ConstraintType,
    ValidationResult,
    TierLevel,
    TierLimits
)


class ConstraintManager:
    """Manages and validates optimization constraints."""
    
    def __init__(self):
        self.tier_limits = {
            TierLevel.FREE: TierLimits(
                max_optimization_runs=5,
                available_algorithms=['linear_programming'],
                max_constraints=5,
                max_time_horizon=30,
                analytics_access=False,
                api_access=False,
                support_level="basic"
            ),
            TierLevel.STANDARD: TierLimits(
                max_optimization_runs=50,
                available_algorithms=['linear_programming', 'genetic_algorithm'],
                max_constraints=15,
                max_time_horizon=90,
                analytics_access=True,
                api_access=False,
                support_level="standard"
            ),
            TierLevel.PRO: TierLimits(
                max_optimization_runs=-1,
                available_algorithms=['linear_programming', 'genetic_algorithm', 'multi_objective_nsga2'],
                max_constraints=-1,
                max_time_horizon=365,
                analytics_access=True,
                api_access=True,
                support_level="premium"
            )
        }
        
        logger.info("ConstraintManager initialized")
    
    async def validate_request(self, request: OptimizationRequest) -> ValidationResult:
        """Validate an optimization request."""
        violations = []
        warnings = []
        suggestions = []
        
        try:
            # Validate tier limits
            tier_validation = await self._validate_tier_limits(request)
            if not tier_validation.is_valid:
                violations.extend(tier_validation.violations)
                warnings.extend(tier_validation.warnings)
            
            # Validate constraints
            constraint_validation = await self.validate_constraints(request.constraints)
            if not constraint_validation.is_valid:
                violations.extend(constraint_validation.violations)
                warnings.extend(constraint_validation.warnings)
            
            # Validate time range
            time_validation = await self._validate_time_range(request)
            if not time_validation.is_valid:
                violations.extend(time_validation.violations)
                warnings.extend(time_validation.warnings)
            
            # Validate job sources
            job_source_validation = await self._validate_job_sources(request)
            if not job_source_validation.is_valid:
                violations.extend(job_source_validation.violations)
                warnings.extend(job_source_validation.warnings)
            
            # Collect all suggestions
            suggestions.extend(tier_validation.suggestions)
            suggestions.extend(constraint_validation.suggestions)
            suggestions.extend(time_validation.suggestions)
            suggestions.extend(job_source_validation.suggestions)
            
            is_valid = len(violations) == 0
            
            return ValidationResult(
                is_valid=is_valid,
                error_message="; ".join(violations) if violations else None,
                warnings=warnings,
                suggestions=suggestions,
                violations=[{"message": v, "type": "validation_error"} for v in violations]
            )
            
        except Exception as e:
            logger.error(f"Request validation failed: {e}")
            return ValidationResult(
                is_valid=False,
                error_message=f"Validation failed: {str(e)}",
                warnings=[],
                suggestions=[],
                violations=[{"message": str(e), "type": "internal_error"}]
            )
    
    async def validate_constraints(self, constraints: List[ConstraintModel]) -> ValidationResult:
        """Validate optimization constraints."""
        violations = []
        warnings = []
        suggestions = []
        
        if not constraints:
            violations.append("At least one constraint is required")
            return ValidationResult(
                is_valid=False,
                error_message="At least one constraint is required",
                violations=[{"message": "No constraints provided", "type": "missing_constraints"}]
            )
        
        # Check for duplicate constraint types
        constraint_types = [c.constraint_type for c in constraints]
        if len(constraint_types) != len(set(constraint_types)):
            violations.append("Duplicate constraint types are not allowed")
        
        # Validate individual constraints
        for constraint in constraints:
            constraint_validation = await self._validate_single_constraint(constraint)
            if not constraint_validation.is_valid:
                violations.extend(constraint_validation.violations)
                warnings.extend(constraint_validation.warnings)
                suggestions.extend(constraint_validation.suggestions)
        
        # Cross-constraint validation
        cross_validation = await self._validate_constraint_compatibility(constraints)
        if not cross_validation.is_valid:
            violations.extend(cross_validation.violations)
            warnings.extend(cross_validation.warnings)
            suggestions.extend(cross_validation.suggestions)
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "constraint_error"} for v in violations]
        )
    
    async def _validate_tier_limits(self, request: OptimizationRequest) -> ValidationResult:
        """Validate request against tier limits."""
        violations = []
        warnings = []
        suggestions = []
        
        tier_limits = self.tier_limits.get(request.tier_level)
        if not tier_limits:
            violations.append(f"Invalid tier level: {request.tier_level}")
            return ValidationResult(
                is_valid=False,
                error_message=f"Invalid tier level: {request.tier_level}",
                violations=[{"message": f"Invalid tier level: {request.tier_level}", "type": "invalid_tier"}]
            )
        
        # Check algorithm availability
        if request.preferences.algorithm not in tier_limits.available_algorithms:
            violations.append(
                f"Algorithm '{request.preferences.algorithm}' is not available for {request.tier_level} tier"
            )
            suggestions.append(
                f"Upgrade to a higher tier to access {request.preferences.algorithm} algorithm"
            )
        
        # Check constraint count
        if tier_limits.max_constraints != -1 and len(request.constraints) > tier_limits.max_constraints:
            violations.append(
                f"Too many constraints: {len(request.constraints)} > {tier_limits.max_constraints} (limit for {request.tier_level} tier)"
            )
            suggestions.append(
                f"Reduce constraints to {tier_limits.max_constraints} or upgrade to a higher tier"
            )
        
        # Check time horizon
        start_date = datetime.fromisoformat(request.time_range['start'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(request.time_range['end'].replace('Z', '+00:00'))
        time_horizon_days = (end_date - start_date).days
        
        if time_horizon_days > tier_limits.max_time_horizon:
            violations.append(
                f"Time horizon too long: {time_horizon_days} days > {tier_limits.max_time_horizon} days (limit for {request.tier_level} tier)"
            )
            suggestions.append(
                f"Reduce time horizon to {tier_limits.max_time_horizon} days or upgrade to a higher tier"
            )
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "tier_limit_error"} for v in violations]
        )
    
    async def _validate_single_constraint(self, constraint: ConstraintModel) -> ValidationResult:
        """Validate a single constraint."""
        violations = []
        warnings = []
        suggestions = []
        
        # Validate constraint values
        if constraint.constraint_value <= 0:
            violations.append(f"Constraint value must be positive: {constraint.constraint_value}")
        
        # Validate constraint-specific rules
        if constraint.constraint_type == ConstraintType.FUYOU_LIMIT:
            if constraint.constraint_value > 5000000:  # 5M yen seems unrealistic
                warnings.append(f"Fuyou limit seems very high: {constraint.constraint_value} yen")
                suggestions.append("Consider double-checking the fuyou limit value")
            elif constraint.constraint_value < 500000:  # 500k yen seems low
                warnings.append(f"Fuyou limit seems very low: {constraint.constraint_value} yen")
        
        elif constraint.constraint_type == ConstraintType.DAILY_HOURS:
            if constraint.constraint_value > 16:
                violations.append(f"Daily hours limit too high: {constraint.constraint_value} hours")
                suggestions.append("Consider setting daily hours limit to 8-12 hours")
            elif constraint.constraint_value < 1:
                violations.append(f"Daily hours limit too low: {constraint.constraint_value} hours")
        
        elif constraint.constraint_type == ConstraintType.WEEKLY_HOURS:
            if constraint.constraint_value > 80:
                warnings.append(f"Weekly hours limit very high: {constraint.constraint_value} hours")
                suggestions.append("Consider reducing weekly hours for better work-life balance")
            elif constraint.constraint_value < 5:
                warnings.append(f"Weekly hours limit very low: {constraint.constraint_value} hours")
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "constraint_value_error"} for v in violations]
        )
    
    async def _validate_constraint_compatibility(self, constraints: List[ConstraintModel]) -> ValidationResult:
        """Validate that constraints are compatible with each other."""
        violations = []
        warnings = []
        suggestions = []
        
        # Find related constraints
        daily_hours = next((c for c in constraints if c.constraint_type == ConstraintType.DAILY_HOURS), None)
        weekly_hours = next((c for c in constraints if c.constraint_type == ConstraintType.WEEKLY_HOURS), None)
        
        # Check daily vs weekly hours compatibility
        if daily_hours and weekly_hours:
            max_weekly_from_daily = daily_hours.constraint_value * 7
            if weekly_hours.constraint_value > max_weekly_from_daily:
                violations.append(
                    f"Weekly hours limit ({weekly_hours.constraint_value}) is inconsistent with daily hours limit ({daily_hours.constraint_value})"
                )
                suggestions.append(
                    f"Consider setting weekly hours to {max_weekly_from_daily} or less"
                )
        
        # Check fuyou limit vs working hours
        fuyou_limit = next((c for c in constraints if c.constraint_type == ConstraintType.FUYOU_LIMIT), None)
        if fuyou_limit and weekly_hours:
            # Estimate minimum hourly rate (assuming 1000 yen/hour)
            min_hourly_rate = 1000
            max_weekly_income = weekly_hours.constraint_value * min_hourly_rate
            max_annual_income = max_weekly_income * 52
            
            if max_annual_income > fuyou_limit.constraint_value * 2:
                warnings.append(
                    "Weekly hours limit may result in income exceeding fuyou limit"
                )
                suggestions.append(
                    "Consider reducing weekly hours or increasing fuyou limit"
                )
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "constraint_compatibility_error"} for v in violations]
        )
    
    async def _validate_time_range(self, request: OptimizationRequest) -> ValidationResult:
        """Validate time range."""
        violations = []
        warnings = []
        suggestions = []
        
        try:
            start_date = datetime.fromisoformat(request.time_range['start'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(request.time_range['end'].replace('Z', '+00:00'))
            
            # Check if start is before end
            if start_date >= end_date:
                violations.append("Start date must be before end date")
            
            # Check if time range is reasonable
            time_span = end_date - start_date
            if time_span.days > 365:
                warnings.append(f"Time range is very long: {time_span.days} days")
                suggestions.append("Consider optimizing shorter time periods for better results")
            elif time_span.days < 1:
                warnings.append("Time range is very short: less than 1 day")
                suggestions.append("Consider optimizing at least a few days for meaningful results")
            
            # Check if start date is too far in the past
            if start_date < datetime.now() - timedelta(days=30):
                warnings.append("Start date is more than 30 days in the past")
                suggestions.append("Consider using a more recent start date")
            
            # Check if end date is too far in the future
            if end_date > datetime.now() + timedelta(days=365):
                warnings.append("End date is more than 1 year in the future")
                suggestions.append("Consider using a nearer end date for more accurate optimization")
            
        except ValueError as e:
            violations.append(f"Invalid date format: {e}")
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "time_range_error"} for v in violations]
        )
    
    async def _validate_job_sources(self, request: OptimizationRequest) -> ValidationResult:
        """Validate job sources."""
        violations = []
        warnings = []
        suggestions = []
        
        if not request.job_sources:
            violations.append("At least one job source is required")
            return ValidationResult(
                is_valid=False,
                error_message="At least one job source is required",
                violations=[{"message": "No job sources provided", "type": "missing_job_sources"}]
            )
        
        # Check for duplicate job source IDs
        job_ids = [js.id for js in request.job_sources]
        if len(job_ids) != len(set(job_ids)):
            violations.append("Duplicate job source IDs are not allowed")
        
        # Validate individual job sources
        for job_source in request.job_sources:
            if job_source.hourly_rate <= 0:
                violations.append(f"Invalid hourly rate for job source '{job_source.name}': {job_source.hourly_rate}")
            
            if job_source.hourly_rate > 10000:  # 10k yen/hour seems very high
                warnings.append(f"Very high hourly rate for job source '{job_source.name}': {job_source.hourly_rate} yen/hour")
            
            if job_source.hourly_rate < 800:  # Below minimum wage
                warnings.append(f"Low hourly rate for job source '{job_source.name}': {job_source.hourly_rate} yen/hour")
                suggestions.append("Consider verifying the hourly rate meets minimum wage requirements")
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "job_source_error"} for v in violations]
        )