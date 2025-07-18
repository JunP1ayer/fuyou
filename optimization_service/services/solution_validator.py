#!/usr/bin/env python3
"""
Solution validator for optimization results.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import asyncio

from loguru import logger

from models.optimization_models import (
    OptimizationSolution,
    SuggestedShift,
    ConstraintModel,
    ConstraintType,
    ValidationResult
)


class SolutionValidator:
    """Validates optimization solutions."""
    
    def __init__(self):
        logger.info("SolutionValidator initialized")
    
    async def validate_solution(
        self,
        solution: OptimizationSolution,
        constraints: List[ConstraintModel]
    ) -> ValidationResult:
        """Validate an optimization solution against constraints."""
        violations = []
        warnings = []
        suggestions = []
        
        try:
            # Validate basic solution structure
            structure_validation = await self._validate_solution_structure(solution)
            if not structure_validation.is_valid:
                violations.extend(structure_validation.violations)
                warnings.extend(structure_validation.warnings)
            
            # Validate constraints satisfaction
            constraint_validation = await self._validate_constraints_satisfaction(solution, constraints)
            if not constraint_validation.is_valid:
                violations.extend(constraint_validation.violations)
                warnings.extend(constraint_validation.warnings)
            
            # Validate shift feasibility
            feasibility_validation = await self._validate_shift_feasibility(solution.suggested_shifts)
            if not feasibility_validation.is_valid:
                violations.extend(feasibility_validation.violations)
                warnings.extend(feasibility_validation.warnings)
            
            # Collect all suggestions
            suggestions.extend(structure_validation.suggestions)
            suggestions.extend(constraint_validation.suggestions)
            suggestions.extend(feasibility_validation.suggestions)
            
            is_valid = len(violations) == 0
            
            return ValidationResult(
                is_valid=is_valid,
                error_message="; ".join(violations) if violations else None,
                warnings=warnings,
                suggestions=suggestions,
                violations=[{"message": v, "type": "solution_validation_error"} for v in violations]
            )
            
        except Exception as e:
            logger.error(f"Solution validation failed: {e}")
            return ValidationResult(
                is_valid=False,
                error_message=f"Validation failed: {str(e)}",
                warnings=[],
                suggestions=[],
                violations=[{"message": str(e), "type": "internal_error"}]
            )
    
    async def _validate_solution_structure(self, solution: OptimizationSolution) -> ValidationResult:
        """Validate the basic structure of the solution."""
        violations = []
        warnings = []
        suggestions = []
        
        # Check if solution has shifts
        if not solution.suggested_shifts:
            violations.append("Solution must contain at least one suggested shift")
            return ValidationResult(
                is_valid=False,
                error_message="Solution must contain at least one suggested shift",
                violations=[{"message": "No shifts in solution", "type": "empty_solution"}]
            )
        
        # Check confidence score
        if solution.confidence_score < 0 or solution.confidence_score > 1:
            violations.append(f"Invalid confidence score: {solution.confidence_score}")
        elif solution.confidence_score < 0.5:
            warnings.append(f"Low confidence score: {solution.confidence_score}")
            suggestions.append("Consider reviewing the optimization parameters or constraints")
        
        # Check objective value
        if solution.objective_value < 0:
            warnings.append(f"Negative objective value: {solution.objective_value}")
        
        # Check consistency of calculated values
        calculated_income = sum(shift.calculated_earnings for shift in solution.suggested_shifts)
        if abs(calculated_income - solution.total_income) > 0.01:
            violations.append(
                f"Income calculation inconsistent: calculated={calculated_income}, reported={solution.total_income}"
            )
        
        calculated_hours = sum(shift.working_hours for shift in solution.suggested_shifts)
        if abs(calculated_hours - solution.total_hours) > 0.01:
            violations.append(
                f"Hours calculation inconsistent: calculated={calculated_hours}, reported={solution.total_hours}"
            )
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "structure_error"} for v in violations]
        )
    
    async def _validate_constraints_satisfaction(
        self,
        solution: OptimizationSolution,
        constraints: List[ConstraintModel]
    ) -> ValidationResult:
        """Validate that the solution satisfies all constraints."""
        violations = []
        warnings = []
        suggestions = []
        
        for constraint in constraints:
            satisfaction_check = await self._check_constraint_satisfaction(solution, constraint)
            
            if not satisfaction_check.is_valid:
                violations.extend(satisfaction_check.violations)
                warnings.extend(satisfaction_check.warnings)
                suggestions.extend(satisfaction_check.suggestions)
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "constraint_violation"} for v in violations]
        )
    
    async def _check_constraint_satisfaction(
        self,
        solution: OptimizationSolution,
        constraint: ConstraintModel
    ) -> ValidationResult:
        """Check if a single constraint is satisfied."""
        violations = []
        warnings = []
        suggestions = []
        
        if constraint.constraint_type == ConstraintType.FUYOU_LIMIT:
            if solution.total_income > constraint.constraint_value:
                violations.append(
                    f"Fuyou limit violation: {solution.total_income} > {constraint.constraint_value}"
                )
                suggestions.append("Consider reducing shift hours or hourly rates")
            elif solution.total_income > constraint.constraint_value * 0.9:
                warnings.append(
                    f"Approaching fuyou limit: {solution.total_income} (limit: {constraint.constraint_value})"
                )
        
        elif constraint.constraint_type == ConstraintType.DAILY_HOURS:
            daily_hours = self._calculate_daily_hours(solution.suggested_shifts)
            max_daily_hours = max(daily_hours.values()) if daily_hours else 0
            
            if max_daily_hours > constraint.constraint_value:
                violations.append(
                    f"Daily hours violation: {max_daily_hours} > {constraint.constraint_value}"
                )
                suggestions.append("Consider reducing daily shift hours")
            elif max_daily_hours > constraint.constraint_value * 0.9:
                warnings.append(
                    f"Approaching daily hours limit: {max_daily_hours} (limit: {constraint.constraint_value})"
                )
        
        elif constraint.constraint_type == ConstraintType.WEEKLY_HOURS:
            weekly_hours = self._calculate_weekly_hours(solution.suggested_shifts)
            max_weekly_hours = max(weekly_hours.values()) if weekly_hours else 0
            
            if max_weekly_hours > constraint.constraint_value:
                violations.append(
                    f"Weekly hours violation: {max_weekly_hours} > {constraint.constraint_value}"
                )
                suggestions.append("Consider reducing weekly shift hours")
            elif max_weekly_hours > constraint.constraint_value * 0.9:
                warnings.append(
                    f"Approaching weekly hours limit: {max_weekly_hours} (limit: {constraint.constraint_value})"
                )
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "constraint_check_error"} for v in violations]
        )
    
    async def _validate_shift_feasibility(self, shifts: List[SuggestedShift]) -> ValidationResult:
        """Validate that all shifts are feasible."""
        violations = []
        warnings = []
        suggestions = []
        
        # Check for overlapping shifts
        overlaps = self._find_overlapping_shifts(shifts)
        if overlaps:
            for overlap in overlaps:
                violations.append(
                    f"Overlapping shifts on {overlap['date']}: {overlap['shift1']['start_time']}-{overlap['shift1']['end_time']} and {overlap['shift2']['start_time']}-{overlap['shift2']['end_time']}"
                )
            suggestions.append("Review shift scheduling to avoid overlaps")
        
        # Check individual shift validity
        for shift in shifts:
            shift_validation = await self._validate_individual_shift(shift)
            if not shift_validation.is_valid:
                violations.extend(shift_validation.violations)
                warnings.extend(shift_validation.warnings)
                suggestions.extend(shift_validation.suggestions)
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "feasibility_error"} for v in violations]
        )
    
    async def _validate_individual_shift(self, shift: SuggestedShift) -> ValidationResult:
        """Validate an individual shift."""
        violations = []
        warnings = []
        suggestions = []
        
        # Check time format and logic
        try:
            start_time = self._time_to_minutes(shift.start_time)
            end_time = self._time_to_minutes(shift.end_time)
            
            if start_time >= end_time:
                violations.append(f"Invalid shift times: {shift.start_time} to {shift.end_time}")
            
            # Check shift duration
            shift_duration = (end_time - start_time) / 60
            if shift_duration > 12:
                warnings.append(f"Very long shift: {shift_duration} hours")
                suggestions.append("Consider breaking long shifts into multiple shorter shifts")
            elif shift_duration < 1:
                violations.append(f"Very short shift: {shift_duration} hours")
        
        except Exception as e:
            violations.append(f"Invalid time format in shift: {e}")
        
        # Check earnings calculation
        calculated_earnings = shift.working_hours * shift.hourly_rate
        if abs(calculated_earnings - shift.calculated_earnings) > 0.01:
            violations.append(
                f"Earnings calculation error: expected {calculated_earnings}, got {shift.calculated_earnings}"
            )
        
        # Check confidence score
        if shift.confidence < 0 or shift.confidence > 1:
            violations.append(f"Invalid confidence score: {shift.confidence}")
        elif shift.confidence < 0.5:
            warnings.append(f"Low confidence shift: {shift.confidence}")
        
        is_valid = len(violations) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            error_message="; ".join(violations) if violations else None,
            warnings=warnings,
            suggestions=suggestions,
            violations=[{"message": v, "type": "shift_validation_error"} for v in violations]
        )
    
    def _calculate_daily_hours(self, shifts: List[SuggestedShift]) -> Dict[str, float]:
        """Calculate daily working hours."""
        daily_hours = {}
        
        for shift in shifts:
            date_str = shift.date.isoformat()
            daily_hours[date_str] = daily_hours.get(date_str, 0) + shift.working_hours
        
        return daily_hours
    
    def _calculate_weekly_hours(self, shifts: List[SuggestedShift]) -> Dict[int, float]:
        """Calculate weekly working hours."""
        weekly_hours = {}
        
        for shift in shifts:
            week = shift.date.isocalendar()[1]
            weekly_hours[week] = weekly_hours.get(week, 0) + shift.working_hours
        
        return weekly_hours
    
    def _find_overlapping_shifts(self, shifts: List[SuggestedShift]) -> List[Dict[str, Any]]:
        """Find overlapping shifts."""
        overlaps = []
        
        # Group shifts by date
        shifts_by_date = {}
        for shift in shifts:
            date_str = shift.date.isoformat()
            if date_str not in shifts_by_date:
                shifts_by_date[date_str] = []
            shifts_by_date[date_str].append(shift)
        
        # Check for overlaps within each date
        for date_str, date_shifts in shifts_by_date.items():
            for i, shift1 in enumerate(date_shifts):
                for j, shift2 in enumerate(date_shifts):
                    if i < j and self._shifts_overlap(shift1, shift2):
                        overlaps.append({
                            'date': date_str,
                            'shift1': {
                                'start_time': shift1.start_time,
                                'end_time': shift1.end_time,
                                'job_source': shift1.job_source_name
                            },
                            'shift2': {
                                'start_time': shift2.start_time,
                                'end_time': shift2.end_time,
                                'job_source': shift2.job_source_name
                            }
                        })
        
        return overlaps
    
    def _shifts_overlap(self, shift1: SuggestedShift, shift2: SuggestedShift) -> bool:
        """Check if two shifts overlap."""
        try:
            start1 = self._time_to_minutes(shift1.start_time)
            end1 = self._time_to_minutes(shift1.end_time)
            start2 = self._time_to_minutes(shift2.start_time)
            end2 = self._time_to_minutes(shift2.end_time)
            
            return not (end1 <= start2 or end2 <= start1)
        except:
            return False
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string to minutes since midnight."""
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes