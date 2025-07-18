#!/usr/bin/env python3
"""
Advanced objective functions for shift optimization.
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from loguru import logger

from models.optimization_models import (
    ObjectiveType,
    ConstraintType,
    SuggestedShift,
    JobSourceModel
)


class ObjectiveFunctions:
    """Advanced objective functions for shift optimization."""
    
    def __init__(self):
        self.name = "Advanced Objective Functions"
        logger.info(f"Initialized {self.name}")
    
    def calculate_income_objective(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel],
        weights: Dict[str, float] = None
    ) -> float:
        """
        Calculate income-based objective with advanced considerations.
        
        Considers:
        - Base income
        - Overtime bonuses
        - Weekend/holiday premiums
        - Consistency bonuses
        - Risk penalties
        """
        if not shifts:
            return 0.0
        
        weights = weights or {
            'base_income': 1.0,
            'overtime_bonus': 0.3,
            'weekend_premium': 0.2,
            'consistency_bonus': 0.1,
            'risk_penalty': -0.2
        }
        
        total_score = 0.0
        
        # Base income
        base_income = sum(shift.get('calculated_earnings', 0) for shift in shifts)
        total_score += base_income * weights['base_income']
        
        # Overtime bonuses (hours > 8 per day)
        overtime_bonus = self._calculate_overtime_bonus(shifts)
        total_score += overtime_bonus * weights['overtime_bonus']
        
        # Weekend premiums
        weekend_premium = self._calculate_weekend_premium(shifts, job_sources)
        total_score += weekend_premium * weights['weekend_premium']
        
        # Consistency bonus (regular schedule)
        consistency_bonus = self._calculate_consistency_bonus(shifts)
        total_score += consistency_bonus * weights['consistency_bonus']
        
        # Risk penalty (approaching limits)
        risk_penalty = self._calculate_risk_penalty(shifts, base_income)
        total_score += risk_penalty * weights['risk_penalty']
        
        logger.debug(f"Income objective: base={base_income}, overtime={overtime_bonus}, "
                    f"weekend={weekend_premium}, consistency={consistency_bonus}, "
                    f"risk={risk_penalty}, total={total_score}")
        
        return total_score
    
    def calculate_work_life_balance_objective(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel],
        weights: Dict[str, float] = None
    ) -> float:
        """
        Calculate work-life balance objective.
        
        Considers:
        - Minimize total hours
        - Prefer consistent schedules
        - Avoid split shifts
        - Minimize evening/weekend work
        - Maximize rest periods
        """
        if not shifts:
            return 0.0
        
        weights = weights or {
            'hour_penalty': -1.0,
            'consistency_bonus': 0.3,
            'split_shift_penalty': -0.5,
            'evening_penalty': -0.2,
            'rest_period_bonus': 0.4
        }
        
        total_score = 0.0
        
        # Hour penalty (minimize total hours)
        total_hours = sum(shift.get('working_hours', 0) for shift in shifts)
        total_score += total_hours * weights['hour_penalty']
        
        # Consistency bonus
        consistency_bonus = self._calculate_consistency_bonus(shifts)
        total_score += consistency_bonus * weights['consistency_bonus']
        
        # Split shift penalty
        split_shift_penalty = self._calculate_split_shift_penalty(shifts)
        total_score += split_shift_penalty * weights['split_shift_penalty']
        
        # Evening work penalty
        evening_penalty = self._calculate_evening_penalty(shifts)
        total_score += evening_penalty * weights['evening_penalty']
        
        # Rest period bonus
        rest_bonus = self._calculate_rest_period_bonus(shifts)
        total_score += rest_bonus * weights['rest_period_bonus']
        
        logger.debug(f"Work-life balance objective: hours={total_hours}, "
                    f"consistency={consistency_bonus}, split={split_shift_penalty}, "
                    f"evening={evening_penalty}, rest={rest_bonus}, total={total_score}")
        
        return total_score
    
    def calculate_job_source_balance_objective(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel],
        weights: Dict[str, float] = None
    ) -> float:
        """
        Calculate job source balance objective.
        
        Considers:
        - Even distribution across job sources
        - Maintain relationships with all employers
        - Skill diversification
        - Income source diversification
        """
        if not shifts:
            return 0.0
        
        weights = weights or {
            'distribution_bonus': 1.0,
            'relationship_bonus': 0.3,
            'skill_diversity_bonus': 0.2,
            'income_diversity_bonus': 0.4
        }
        
        total_score = 0.0
        
        # Calculate distribution score
        distribution_score = self._calculate_distribution_score(shifts, job_sources)
        total_score += distribution_score * weights['distribution_bonus']
        
        # Relationship maintenance bonus
        relationship_bonus = self._calculate_relationship_bonus(shifts, job_sources)
        total_score += relationship_bonus * weights['relationship_bonus']
        
        # Skill diversification
        skill_diversity = self._calculate_skill_diversity(shifts, job_sources)
        total_score += skill_diversity * weights['skill_diversity_bonus']
        
        # Income diversification
        income_diversity = self._calculate_income_diversity(shifts, job_sources)
        total_score += income_diversity * weights['income_diversity_bonus']
        
        logger.debug(f"Job balance objective: distribution={distribution_score}, "
                    f"relationship={relationship_bonus}, skill={skill_diversity}, "
                    f"income={income_diversity}, total={total_score}")
        
        return total_score
    
    def calculate_multi_objective_score(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel],
        objective_weights: Dict[str, float] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate multi-objective score using weighted sum approach.
        
        Returns tuple of (total_score, individual_scores)
        """
        objective_weights = objective_weights or {
            'income': 0.5,
            'work_life_balance': 0.3,
            'job_source_balance': 0.2
        }
        
        # Calculate individual objectives
        income_score = self.calculate_income_objective(shifts, job_sources)
        balance_score = self.calculate_work_life_balance_objective(shifts, job_sources)
        job_balance_score = self.calculate_job_source_balance_objective(shifts, job_sources)
        
        # Normalize scores (simple min-max normalization)
        scores = {
            'income': income_score,
            'work_life_balance': balance_score,
            'job_source_balance': job_balance_score
        }
        
        # Weighted sum
        total_score = (
            income_score * objective_weights['income'] +
            balance_score * objective_weights['work_life_balance'] +
            job_balance_score * objective_weights['job_source_balance']
        )
        
        return total_score, scores
    
    def calculate_constraint_penalty(
        self,
        shifts: List[Dict[str, Any]],
        constraints: Dict[str, Any],
        penalty_weights: Dict[str, float] = None
    ) -> float:
        """
        Calculate penalty for constraint violations.
        
        Used in penalty-based optimization methods.
        """
        penalty_weights = penalty_weights or {
            'fuyou_limit': 1000.0,
            'daily_hours': 100.0,
            'weekly_hours': 50.0,
            'availability': 200.0
        }
        
        total_penalty = 0.0
        
        # Fuyou limit penalty
        if ConstraintType.FUYOU_LIMIT in constraints:
            fuyou_limit = constraints[ConstraintType.FUYOU_LIMIT].constraint_value
            total_income = sum(shift.get('calculated_earnings', 0) for shift in shifts)
            
            if total_income > fuyou_limit:
                violation = total_income - fuyou_limit
                total_penalty += violation * penalty_weights['fuyou_limit']
        
        # Daily hours penalty
        if ConstraintType.DAILY_HOURS in constraints:
            daily_limit = constraints[ConstraintType.DAILY_HOURS].constraint_value
            daily_hours = self._calculate_daily_hours_dict(shifts)
            
            for date, hours in daily_hours.items():
                if hours > daily_limit:
                    violation = hours - daily_limit
                    total_penalty += violation * penalty_weights['daily_hours']
        
        # Weekly hours penalty
        if ConstraintType.WEEKLY_HOURS in constraints:
            weekly_limit = constraints[ConstraintType.WEEKLY_HOURS].constraint_value
            weekly_hours = self._calculate_weekly_hours_dict(shifts)
            
            for week, hours in weekly_hours.items():
                if hours > weekly_limit:
                    violation = hours - weekly_limit
                    total_penalty += violation * penalty_weights['weekly_hours']
        
        return total_penalty
    
    # Helper methods
    
    def _calculate_overtime_bonus(self, shifts: List[Dict[str, Any]]) -> float:
        """Calculate overtime bonus for shifts over 8 hours per day."""
        daily_hours = self._calculate_daily_hours_dict(shifts)
        
        overtime_bonus = 0.0
        for date, hours in daily_hours.items():
            if hours > 8:
                overtime_hours = hours - 8
                # Assume 1.5x rate for overtime
                overtime_bonus += overtime_hours * 1000 * 0.5  # 500 yen bonus per OT hour
        
        return overtime_bonus
    
    def _calculate_weekend_premium(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel]
    ) -> float:
        """Calculate weekend premium."""
        weekend_premium = 0.0
        
        for shift in shifts:
            date = shift.get('date')
            if date and hasattr(date, 'weekday'):
                # Saturday (5) and Sunday (6) are weekends
                if date.weekday() >= 5:
                    earnings = shift.get('calculated_earnings', 0)
                    weekend_premium += earnings * 0.1  # 10% weekend premium
        
        return weekend_premium
    
    def _calculate_consistency_bonus(self, shifts: List[Dict[str, Any]]) -> float:
        """Calculate bonus for consistent scheduling."""
        if not shifts:
            return 0.0
        
        # Group shifts by day of week
        day_patterns = {}
        for shift in shifts:
            date = shift.get('date')
            if date and hasattr(date, 'weekday'):
                day_of_week = date.weekday()
                if day_of_week not in day_patterns:
                    day_patterns[day_of_week] = []
                
                day_patterns[day_of_week].append({
                    'start': shift.get('start_time'),
                    'duration': shift.get('working_hours', 0)
                })
        
        # Calculate consistency score
        consistency_score = 0.0
        for day, patterns in day_patterns.items():
            if len(patterns) > 1:
                # Check if shifts on the same day of week are consistent
                start_times = [p['start'] for p in patterns]
                durations = [p['duration'] for p in patterns]
                
                # Bonus for consistent start times
                if len(set(start_times)) == 1:
                    consistency_score += 500  # 500 yen bonus
                
                # Bonus for consistent durations
                if len(set(durations)) == 1:
                    consistency_score += 300  # 300 yen bonus
        
        return consistency_score
    
    def _calculate_split_shift_penalty(self, shifts: List[Dict[str, Any]]) -> float:
        """Calculate penalty for split shifts on the same day."""
        daily_shifts = {}
        
        for shift in shifts:
            date = shift.get('date')
            if date:
                date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
                if date_str not in daily_shifts:
                    daily_shifts[date_str] = []
                daily_shifts[date_str].append(shift)
        
        penalty = 0.0
        for date, day_shifts in daily_shifts.items():
            if len(day_shifts) > 1:
                # Penalty for multiple shifts on same day
                penalty += (len(day_shifts) - 1) * 1000  # 1000 yen penalty per extra shift
        
        return penalty
    
    def _calculate_evening_penalty(self, shifts: List[Dict[str, Any]]) -> float:
        """Calculate penalty for evening work."""
        penalty = 0.0
        
        for shift in shifts:
            start_time = shift.get('start_time', '')
            if start_time:
                try:
                    hour = int(start_time.split(':')[0])
                    if hour >= 18:  # 6 PM or later
                        penalty += shift.get('working_hours', 0) * 100  # 100 yen penalty per hour
                except:
                    pass
        
        return penalty
    
    def _calculate_rest_period_bonus(self, shifts: List[Dict[str, Any]]) -> float:
        """Calculate bonus for adequate rest periods between shifts."""
        if len(shifts) < 2:
            return 0.0
        
        # Sort shifts by date and time
        sorted_shifts = sorted(shifts, key=lambda s: (s.get('date', ''), s.get('start_time', '')))
        
        bonus = 0.0
        for i in range(1, len(sorted_shifts)):
            prev_shift = sorted_shifts[i-1]
            curr_shift = sorted_shifts[i]
            
            # Calculate rest period (simplified)
            try:
                prev_date = prev_shift.get('date')
                curr_date = curr_shift.get('date')
                
                if prev_date and curr_date:
                    # If consecutive days
                    if hasattr(prev_date, 'date') and hasattr(curr_date, 'date'):
                        if (curr_date - prev_date).days == 1:
                            # Bonus for having a day off
                            bonus += 500
                    
                    # Same day - check time gap
                    if prev_date == curr_date:
                        prev_end = prev_shift.get('end_time', '')
                        curr_start = curr_shift.get('start_time', '')
                        
                        if prev_end and curr_start:
                            # Calculate time gap (simplified)
                            prev_end_hour = int(prev_end.split(':')[0])
                            curr_start_hour = int(curr_start.split(':')[0])
                            
                            if curr_start_hour > prev_end_hour + 2:  # At least 2 hours rest
                                bonus += 200
            except:
                pass
        
        return bonus
    
    def _calculate_distribution_score(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel]
    ) -> float:
        """Calculate score for even distribution across job sources."""
        if not shifts or not job_sources:
            return 0.0
        
        # Count shifts per job source
        job_counts = {}
        for shift in shifts:
            job_id = shift.get('job_source_id')
            if job_id:
                job_counts[job_id] = job_counts.get(job_id, 0) + 1
        
        if not job_counts:
            return 0.0
        
        # Calculate distribution score (lower coefficient of variation = better)
        counts = list(job_counts.values())
        if len(counts) == 1:
            return 500  # Single job source, full score
        
        mean_count = np.mean(counts)
        std_count = np.std(counts)
        
        if mean_count == 0:
            return 0.0
        
        cv = std_count / mean_count
        distribution_score = max(0, 1000 * (1 - cv))  # Higher score for lower CV
        
        return distribution_score
    
    def _calculate_relationship_bonus(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel]
    ) -> float:
        """Calculate bonus for maintaining relationships with all job sources."""
        if not shifts or not job_sources:
            return 0.0
        
        # Get unique job sources used
        used_job_sources = set()
        for shift in shifts:
            job_id = shift.get('job_source_id')
            if job_id:
                used_job_sources.add(job_id)
        
        # Bonus for using all available job sources
        total_job_sources = len(job_sources)
        used_count = len(used_job_sources)
        
        if total_job_sources == 0:
            return 0.0
        
        relationship_score = (used_count / total_job_sources) * 1000
        return relationship_score
    
    def _calculate_skill_diversity(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel]
    ) -> float:
        """Calculate skill diversity score."""
        # This is a simplified version - in practice, you'd have job categories
        used_job_sources = set()
        for shift in shifts:
            job_id = shift.get('job_source_id')
            if job_id:
                used_job_sources.add(job_id)
        
        # Simple diversity score based on number of different job sources
        diversity_score = len(used_job_sources) * 200
        return diversity_score
    
    def _calculate_income_diversity(
        self,
        shifts: List[Dict[str, Any]],
        job_sources: Dict[str, JobSourceModel]
    ) -> float:
        """Calculate income source diversity score."""
        if not shifts:
            return 0.0
        
        # Calculate income distribution across job sources
        job_income = {}
        for shift in shifts:
            job_id = shift.get('job_source_id')
            if job_id:
                earnings = shift.get('calculated_earnings', 0)
                job_income[job_id] = job_income.get(job_id, 0) + earnings
        
        if not job_income:
            return 0.0
        
        # Calculate diversity using Shannon entropy
        total_income = sum(job_income.values())
        if total_income == 0:
            return 0.0
        
        entropy = 0.0
        for income in job_income.values():
            if income > 0:
                p = income / total_income
                entropy -= p * np.log2(p)
        
        # Normalize entropy (max entropy for equal distribution)
        max_entropy = np.log2(len(job_income))
        if max_entropy == 0:
            return 0.0
        
        normalized_entropy = entropy / max_entropy
        diversity_score = normalized_entropy * 1000
        
        return diversity_score
    
    def _calculate_daily_hours_dict(self, shifts: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate daily hours dictionary."""
        daily_hours = {}
        
        for shift in shifts:
            date = shift.get('date')
            if date:
                date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
                hours = shift.get('working_hours', 0)
                daily_hours[date_str] = daily_hours.get(date_str, 0) + hours
        
        return daily_hours
    
    def _calculate_weekly_hours_dict(self, shifts: List[Dict[str, Any]]) -> Dict[int, float]:
        """Calculate weekly hours dictionary."""
        weekly_hours = {}
        
        for shift in shifts:
            date = shift.get('date')
            if date and hasattr(date, 'isocalendar'):
                week = date.isocalendar()[1]
                hours = shift.get('working_hours', 0)
                weekly_hours[week] = weekly_hours.get(week, 0) + hours
        
        return weekly_hours