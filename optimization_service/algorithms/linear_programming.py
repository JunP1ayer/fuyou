#!/usr/bin/env python3
"""
Linear programming optimization algorithm for shift scheduling.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import uuid

import numpy as np
import pandas as pd
from scipy.optimize import linprog
from loguru import logger

from models.optimization_models import (
    ObjectiveType,
    ConstraintType,
    OptimizationPreferences
)


class LinearProgrammingOptimizer:
    """Linear programming optimizer for shift scheduling."""
    
    def __init__(self):
        self.name = "Linear Programming Optimizer"
        logger.info(f"Initialized {self.name}")
    
    async def optimize(
        self,
        problem_data: Dict[str, Any],
        objective: ObjectiveType,
        constraints: List[Any],
        preferences: OptimizationPreferences
    ) -> Dict[str, Any]:
        """
        Optimize shift schedule using linear programming.
        
        This is a simplified implementation that demonstrates the core concepts.
        In a production system, you would use more sophisticated modeling.
        """
        logger.info(f"Starting linear programming optimization with objective: {objective}")
        
        try:
            # Extract problem components
            date_range = problem_data['date_range']
            job_sources = problem_data['job_sources']
            constraints_dict = problem_data['constraints']
            existing_shifts = problem_data['existing_shifts']
            
            # Create decision variables
            # Variables: x[i,j,t] = 1 if we schedule shift i at job j on day t
            variables = self._create_decision_variables(date_range, job_sources)
            
            # Build objective function
            objective_coefficients = self._build_objective_function(
                variables, job_sources, objective
            )
            
            # Build constraints
            constraint_matrix, constraint_bounds = self._build_constraints(
                variables, constraints_dict, job_sources, date_range
            )
            
            # Solve linear program
            result = linprog(
                c=objective_coefficients,
                A_ub=constraint_matrix,
                b_ub=constraint_bounds,
                bounds=[(0, 1) for _ in range(len(objective_coefficients))],
                method='highs',
                options={'maxiter': preferences.max_iterations or 1000}
            )
            
            if not result.success:
                logger.warning(f"Linear programming optimization failed: {result.message}")
                return self._create_fallback_solution(problem_data, objective)
            
            # Extract solution
            solution_shifts = self._extract_solution(
                result.x, variables, job_sources, date_range
            )
            
            # Calculate objective value
            objective_value = -result.fun if objective == ObjectiveType.MAXIMIZE_INCOME else result.fun
            
            return {
                'shifts': solution_shifts,
                'objective_value': objective_value,
                'confidence_score': 0.9,
                'metadata': {
                    'algorithm': 'linear_programming',
                    'solver_status': result.message,
                    'iterations': result.nit,
                    'solver_time': result.get('solver_time', 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Linear programming optimization failed: {e}")
            return self._create_fallback_solution(problem_data, objective)
    
    def _create_decision_variables(
        self,
        date_range: pd.DatetimeIndex,
        job_sources: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Create decision variables for the optimization problem."""
        variables = []
        
        for date in date_range:
            for job_id, job_source in job_sources.items():
                # Create variables for different shift durations
                for shift_duration in [4, 6, 8]:  # 4, 6, 8 hour shifts
                    for start_hour in range(8, 20):  # 8 AM to 8 PM starts
                        end_hour = start_hour + shift_duration
                        if end_hour <= 22:  # End by 10 PM
                            variables.append({
                                'id': len(variables),
                                'date': date.date(),
                                'job_id': job_id,
                                'job_source': job_source,
                                'start_hour': start_hour,
                                'end_hour': end_hour,
                                'duration': shift_duration,
                                'start_time': f"{start_hour:02d}:00",
                                'end_time': f"{end_hour:02d}:00"
                            })
        
        logger.info(f"Created {len(variables)} decision variables")
        return variables
    
    def _build_objective_function(
        self,
        variables: List[Dict[str, Any]],
        job_sources: Dict[str, Any],
        objective: ObjectiveType
    ) -> np.ndarray:
        """Build the objective function coefficients."""
        coefficients = []
        
        for var in variables:
            job_source = var['job_source']
            duration = var['duration']
            
            if objective == ObjectiveType.MAXIMIZE_INCOME:
                # Maximize income: coefficient = hourly_rate * duration
                coeff = job_source.hourly_rate * duration
                coefficients.append(-coeff)  # Negative because linprog minimizes
            elif objective == ObjectiveType.MINIMIZE_HOURS:
                # Minimize hours: coefficient = duration
                coefficients.append(duration)
            else:
                # Default: maximize income
                coeff = job_source.hourly_rate * duration
                coefficients.append(-coeff)
        
        return np.array(coefficients)
    
    def _build_constraints(
        self,
        variables: List[Dict[str, Any]],
        constraints_dict: Dict[str, Any],
        job_sources: Dict[str, Any],
        date_range: pd.DatetimeIndex
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Build constraint matrix and bounds."""
        constraint_matrix = []
        constraint_bounds = []
        
        # 1. Daily hours constraint
        if ConstraintType.DAILY_HOURS in constraints_dict:
            daily_limit = constraints_dict[ConstraintType.DAILY_HOURS].constraint_value
            
            # Group variables by date
            dates = list(set(var['date'] for var in variables))
            for date in dates:
                constraint_row = []
                for var in variables:
                    if var['date'] == date:
                        constraint_row.append(var['duration'])
                    else:
                        constraint_row.append(0)
                
                constraint_matrix.append(constraint_row)
                constraint_bounds.append(daily_limit)
        
        # 2. Weekly hours constraint
        if ConstraintType.WEEKLY_HOURS in constraints_dict:
            weekly_limit = constraints_dict[ConstraintType.WEEKLY_HOURS].constraint_value
            
            # Group variables by week
            weeks = {}
            for var in variables:
                week = var['date'].isocalendar()[1]
                if week not in weeks:
                    weeks[week] = []
                weeks[week].append(var['id'])
            
            for week, var_ids in weeks.items():
                constraint_row = []
                for var in variables:
                    if var['id'] in var_ids:
                        constraint_row.append(var['duration'])
                    else:
                        constraint_row.append(0)
                
                constraint_matrix.append(constraint_row)
                constraint_bounds.append(weekly_limit)
        
        # 3. Fuyou limit constraint (income limit)
        if ConstraintType.FUYOU_LIMIT in constraints_dict:
            fuyou_limit = constraints_dict[ConstraintType.FUYOU_LIMIT].constraint_value
            
            # Convert to daily limit (assuming constraint is annual)
            days_in_period = len(date_range)
            daily_income_limit = fuyou_limit / (365 / days_in_period)
            
            constraint_row = []
            for var in variables:
                job_source = var['job_source']
                income = job_source.hourly_rate * var['duration']
                constraint_row.append(income)
            
            constraint_matrix.append(constraint_row)
            constraint_bounds.append(daily_income_limit)
        
        # 4. No overlapping shifts on same day
        dates = list(set(var['date'] for var in variables))
        for date in dates:
            date_vars = [var for var in variables if var['date'] == date]
            
            # Check for overlapping time slots
            for i, var1 in enumerate(date_vars):
                for j, var2 in enumerate(date_vars):
                    if i < j and self._shifts_overlap(var1, var2):
                        constraint_row = [0] * len(variables)
                        constraint_row[var1['id']] = 1
                        constraint_row[var2['id']] = 1
                        
                        constraint_matrix.append(constraint_row)
                        constraint_bounds.append(1)  # At most one of the overlapping shifts
        
        if not constraint_matrix:
            # If no constraints, add a dummy constraint
            constraint_matrix = [[0] * len(variables)]
            constraint_bounds = [float('inf')]
        
        return np.array(constraint_matrix), np.array(constraint_bounds)
    
    def _shifts_overlap(self, var1: Dict[str, Any], var2: Dict[str, Any]) -> bool:
        """Check if two shifts overlap in time."""
        return not (var1['end_hour'] <= var2['start_hour'] or var2['end_hour'] <= var1['start_hour'])
    
    def _extract_solution(
        self,
        solution_vector: np.ndarray,
        variables: List[Dict[str, Any]],
        job_sources: Dict[str, Any],
        date_range: pd.DatetimeIndex
    ) -> List[Dict[str, Any]]:
        """Extract suggested shifts from the solution vector."""
        suggested_shifts = []
        
        for i, value in enumerate(solution_vector):
            if value > 0.5:  # Variable is selected (binary approximation)
                var = variables[i]
                job_source = var['job_source']
                
                # Calculate working hours (assuming 30 min break for shifts > 6 hours)
                break_minutes = 30 if var['duration'] > 6 else 0
                working_hours = var['duration'] - (break_minutes / 60)
                calculated_earnings = working_hours * job_source.hourly_rate
                
                shift = {
                    'job_source_id': var['job_id'],
                    'job_source_name': job_source.name,
                    'date': var['date'],
                    'start_time': var['start_time'],
                    'end_time': var['end_time'],
                    'hourly_rate': job_source.hourly_rate,
                    'break_minutes': break_minutes,
                    'working_hours': working_hours,
                    'calculated_earnings': calculated_earnings,
                    'confidence': 0.9,
                    'priority': 1,
                    'reasoning': f"Optimized shift at {job_source.name} for {var['duration']} hours",
                    'is_original': False
                }
                
                suggested_shifts.append(shift)
        
        logger.info(f"Extracted {len(suggested_shifts)} suggested shifts from solution")
        return suggested_shifts
    
    def _create_fallback_solution(
        self,
        problem_data: Dict[str, Any],
        objective: ObjectiveType
    ) -> Dict[str, Any]:
        """Create a fallback solution when optimization fails."""
        logger.info("Creating fallback solution")
        
        date_range = problem_data['date_range']
        job_sources = problem_data['job_sources']
        constraints_dict = problem_data['constraints']
        
        # Simple heuristic: schedule one shift per day at the highest paying job
        if not job_sources:
            return {
                'shifts': [],
                'objective_value': 0,
                'confidence_score': 0.1,
                'metadata': {'algorithm': 'fallback', 'reason': 'no_job_sources'}
            }
        
        # Find the best job source
        best_job = max(job_sources.values(), key=lambda js: js.hourly_rate)
        
        # Get daily hours limit
        daily_limit = 8  # Default
        if ConstraintType.DAILY_HOURS in constraints_dict:
            daily_limit = min(daily_limit, constraints_dict[ConstraintType.DAILY_HOURS].constraint_value)
        
        suggested_shifts = []
        total_income = 0
        
        for date in date_range[:7]:  # Limit to first week for fallback
            # Create a simple shift
            shift_hours = min(daily_limit, 6)  # 6 hour shifts
            calculated_earnings = shift_hours * best_job.hourly_rate
            total_income += calculated_earnings
            
            # Check fuyou limit
            if ConstraintType.FUYOU_LIMIT in constraints_dict:
                fuyou_limit = constraints_dict[ConstraintType.FUYOU_LIMIT].constraint_value
                if total_income > fuyou_limit * 0.8:  # Stop at 80% of limit
                    break
            
            shift = {
                'job_source_id': best_job.id,
                'job_source_name': best_job.name,
                'date': date.date(),
                'start_time': "10:00",
                'end_time': f"{10 + shift_hours:02d}:00",
                'hourly_rate': best_job.hourly_rate,
                'break_minutes': 30 if shift_hours > 6 else 0,
                'working_hours': shift_hours - (0.5 if shift_hours > 6 else 0),
                'calculated_earnings': calculated_earnings,
                'confidence': 0.5,
                'priority': 2,
                'reasoning': f"Fallback solution: simple shift at highest paying job",
                'is_original': False
            }
            
            suggested_shifts.append(shift)
        
        return {
            'shifts': suggested_shifts,
            'objective_value': total_income,
            'confidence_score': 0.5,
            'metadata': {
                'algorithm': 'fallback',
                'reason': 'optimization_failed',
                'total_shifts': len(suggested_shifts)
            }
        }