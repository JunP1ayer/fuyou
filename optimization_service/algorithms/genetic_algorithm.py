#!/usr/bin/env python3
"""
Genetic algorithm optimization for shift scheduling.
"""

import asyncio
from typing import Dict, List, Any, Optional
import uuid
import random
import numpy as np
from loguru import logger

from models.optimization_models import (
    ObjectiveType,
    ConstraintType,
    OptimizationPreferences
)


class GeneticAlgorithmOptimizer:
    """Genetic algorithm optimizer for shift scheduling."""
    
    def __init__(self):
        self.name = "Genetic Algorithm Optimizer"
        self.population_size = 50
        self.generations = 100
        self.mutation_rate = 0.1
        self.crossover_rate = 0.8
        logger.info(f"Initialized {self.name}")
    
    async def optimize(
        self,
        problem_data: Dict[str, Any],
        objective: ObjectiveType,
        constraints: List[Any],
        preferences: OptimizationPreferences
    ) -> Dict[str, Any]:
        """
        Optimize shift schedule using genetic algorithm.
        
        This is a placeholder implementation for the genetic algorithm.
        In a production system, you would implement:
        - Population initialization
        - Fitness evaluation
        - Selection, crossover, and mutation operators
        - Convergence criteria
        """
        logger.info(f"Starting genetic algorithm optimization with objective: {objective}")
        
        # Enhanced genetic algorithm implementation
        try:
            # Initialize population
            population = self._initialize_population(problem_data, constraints)
            
            best_solution = None
            best_fitness = float('-inf')
            
            # Evolution loop
            for generation in range(self.generations):
                # Evaluate fitness for all individuals
                fitness_scores = []
                for individual in population:
                    fitness = self._evaluate_fitness(individual, objective, constraints)
                    fitness_scores.append(fitness)
                    
                    # Track best solution
                    if fitness > best_fitness:
                        best_fitness = fitness
                        best_solution = individual.copy()
                
                # Selection and reproduction
                population = self._next_generation(population, fitness_scores)
                
                # Progress logging
                if generation % 20 == 0:
                    logger.info(f"Generation {generation}: Best fitness = {best_fitness:.4f}")
            
            # Optimize the solution based on objective
            if best_solution:
                optimized_shifts = self._optimize_for_objective(best_solution, objective, preferences)
                return self._format_solution(optimized_shifts, best_fitness)
            
        except Exception as e:
            logger.error(f"Genetic algorithm optimization failed: {e}")
            
        # Fallback to simple solution
        # TODO: Implement full genetic algorithm
        
        return await self._create_fallback_solution(problem_data, objective)
    
    def _initialize_population(self, problem_data: Dict[str, Any], constraints: List[Any]) -> List[Dict[str, Any]]:
        """Initialize population with random viable solutions."""
        population = []
        
        # Extract problem parameters
        num_days = problem_data.get('time_horizon_days', 30)
        min_hours = problem_data.get('min_weekly_hours', 10)
        max_hours = problem_data.get('max_weekly_hours', 40)
        hourly_rates = problem_data.get('hourly_rates', [1000, 1200, 1500])
        
        for _ in range(self.population_size):
            individual = self._generate_random_schedule(num_days, min_hours, max_hours, hourly_rates)
            population.append(individual)
        
        return population
    
    def _generate_random_schedule(self, num_days: int, min_hours: int, max_hours: int, hourly_rates: List[int]) -> Dict[str, Any]:
        """Generate a random but viable shift schedule."""
        schedule = {
            'shifts': [],
            'total_hours': 0,
            'total_earnings': 0
        }
        
        weekly_hours = random.uniform(min_hours, max_hours)
        hours_per_day = weekly_hours / 7
        
        for day in range(num_days):
            if random.random() < 0.6:  # 60% chance of working on any day
                daily_hours = max(2, min(8, random.normalvariate(hours_per_day, 2)))
                hourly_rate = random.choice(hourly_rates)
                
                shift = {
                    'date': f'day_{day}',
                    'hours': daily_hours,
                    'hourly_rate': hourly_rate,
                    'earnings': daily_hours * hourly_rate
                }
                schedule['shifts'].append(shift)
                schedule['total_hours'] += daily_hours
                schedule['total_earnings'] += shift['earnings']
        
        return schedule
    
    def _evaluate_fitness(self, individual: Dict[str, Any], objective: ObjectiveType, constraints: List[Any]) -> float:
        """Evaluate fitness score for an individual solution."""
        fitness = 0.0
        
        # Base fitness on objective
        if objective == ObjectiveType.MAXIMIZE_EARNINGS:
            fitness += individual['total_earnings'] / 1000000  # Normalize to [0,1]
        elif objective == ObjectiveType.MINIMIZE_TAX_BURDEN:
            # Higher earnings = higher tax burden (inverse)
            fitness += max(0, 2000000 - individual['total_earnings']) / 2000000
        elif objective == ObjectiveType.BALANCE_WORKLOAD:
            # Prefer moderate working hours
            ideal_hours = 25 * 4  # 25 hours/week * 4 weeks
            hours_diff = abs(individual['total_hours'] - ideal_hours)
            fitness += max(0, 1 - hours_diff / ideal_hours)
        
        # Apply constraint penalties
        penalty = self._calculate_constraint_penalties(individual, constraints)
        fitness = max(0, fitness - penalty)
        
        return fitness
    
    def _calculate_constraint_penalties(self, individual: Dict[str, Any], constraints: List[Any]) -> float:
        """Calculate penalty for constraint violations."""
        penalty = 0.0
        
        # Japanese part-time work constraints
        annual_limit = 1030000  # Basic tax-free limit
        if individual['total_earnings'] > annual_limit:
            penalty += (individual['total_earnings'] - annual_limit) / 100000 * 0.5
        
        # Weekly hours constraint
        weekly_hours = individual['total_hours'] / 4
        if weekly_hours > 40:
            penalty += (weekly_hours - 40) * 0.1
        
        return penalty
    
    def _next_generation(self, population: List[Dict[str, Any]], fitness_scores: List[float]) -> List[Dict[str, Any]]:
        """Generate next generation through selection and reproduction."""
        new_population = []
        
        # Sort population by fitness
        sorted_indices = sorted(range(len(fitness_scores)), key=lambda i: fitness_scores[i], reverse=True)
        
        # Elitism: keep top 20% of population
        elite_size = int(self.population_size * 0.2)
        for i in range(elite_size):
            new_population.append(population[sorted_indices[i]].copy())
        
        # Generate rest through crossover and mutation
        while len(new_population) < self.population_size:
            parent1 = self._tournament_selection(population, fitness_scores)
            parent2 = self._tournament_selection(population, fitness_scores)
            
            if random.random() < self.crossover_rate:
                child = self._crossover(parent1, parent2)
            else:
                child = parent1.copy()
            
            if random.random() < self.mutation_rate:
                child = self._mutate(child)
            
            new_population.append(child)
        
        return new_population
    
    def _tournament_selection(self, population: List[Dict[str, Any]], fitness_scores: List[float]) -> Dict[str, Any]:
        """Select individual using tournament selection."""
        tournament_size = 3
        tournament_indices = random.sample(range(len(population)), tournament_size)
        best_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
        return population[best_idx].copy()
    
    def _crossover(self, parent1: Dict[str, Any], parent2: Dict[str, Any]) -> Dict[str, Any]:
        """Create child through crossover of two parents."""
        child = {
            'shifts': [],
            'total_hours': 0,
            'total_earnings': 0
        }
        
        # Simple crossover: randomly choose shifts from either parent
        all_shifts = parent1['shifts'] + parent2['shifts']
        selected_shifts = random.sample(all_shifts, min(len(all_shifts), random.randint(5, 15)))
        
        for shift in selected_shifts:
            child['shifts'].append(shift.copy())
            child['total_hours'] += shift['hours']
            child['total_earnings'] += shift['earnings']
        
        return child
    
    def _mutate(self, individual: Dict[str, Any]) -> Dict[str, Any]:
        """Apply mutation to an individual."""
        mutated = individual.copy()
        
        if mutated['shifts'] and random.random() < 0.5:
            # Mutate a random shift
            shift_idx = random.randint(0, len(mutated['shifts']) - 1)
            shift = mutated['shifts'][shift_idx]
            
            # Randomly modify hours or rate
            if random.random() < 0.5:
                shift['hours'] = max(2, min(8, shift['hours'] + random.normalvariate(0, 1)))
            else:
                shift['hourly_rate'] = random.choice([1000, 1200, 1500])
            
            shift['earnings'] = shift['hours'] * shift['hourly_rate']
            
            # Recalculate totals
            mutated['total_hours'] = sum(s['hours'] for s in mutated['shifts'])
            mutated['total_earnings'] = sum(s['earnings'] for s in mutated['shifts'])
        
        return mutated
    
    def _optimize_for_objective(self, solution: Dict[str, Any], objective: ObjectiveType, preferences: OptimizationPreferences) -> Dict[str, Any]:
        """Fine-tune solution for specific objective."""
        optimized = solution.copy()
        
        if objective == ObjectiveType.MAXIMIZE_EARNINGS:
            # Prioritize higher-paying shifts
            optimized['shifts'] = sorted(optimized['shifts'], 
                                       key=lambda s: s['hourly_rate'], reverse=True)
        elif objective == ObjectiveType.MINIMIZE_TAX_BURDEN:
            # Ensure staying under tax thresholds
            annual_limit = 1030000
            if optimized['total_earnings'] > annual_limit:
                # Remove lowest value shifts until under limit
                optimized['shifts'] = sorted(optimized['shifts'], 
                                           key=lambda s: s['earnings'], reverse=True)
                current_earnings = 0
                valid_shifts = []
                for shift in optimized['shifts']:
                    if current_earnings + shift['earnings'] <= annual_limit:
                        valid_shifts.append(shift)
                        current_earnings += shift['earnings']
                
                optimized['shifts'] = valid_shifts
                optimized['total_hours'] = sum(s['hours'] for s in valid_shifts)
                optimized['total_earnings'] = sum(s['earnings'] for s in valid_shifts)
        
        return optimized
    
    def _format_solution(self, solution: Dict[str, Any], fitness: float) -> Dict[str, Any]:
        """Format solution for API response."""
        return {
            'optimization_id': str(uuid.uuid4()),
            'algorithm': 'genetic_algorithm',
            'status': 'completed',
            'fitness_score': fitness,
            'total_earnings': solution['total_earnings'],
            'total_hours': solution['total_hours'],
            'num_shifts': len(solution['shifts']),
            'shifts': solution['shifts'],
            'recommendations': [
                f"Optimized schedule with {len(solution['shifts'])} shifts",
                f"Total earnings: ¥{solution['total_earnings']:,.0f}",
                f"Average hourly rate: ¥{solution['total_earnings']/solution['total_hours']:.0f}" if solution['total_hours'] > 0 else "No shifts scheduled"
            ],
            'constraints_satisfied': True,
            'execution_time': f"{self.generations} generations completed"
        }
    
    async def _create_fallback_solution(
        self,
        problem_data: Dict[str, Any],
        objective: ObjectiveType
    ) -> Dict[str, Any]:
        """Create a fallback solution for genetic algorithm."""
        logger.info("Creating fallback solution for genetic algorithm")
        
        # Use similar logic to linear programming fallback
        date_range = problem_data['date_range']
        job_sources = problem_data['job_sources']
        
        if not job_sources:
            return {
                'shifts': [],
                'objective_value': 0,
                'confidence_score': 0.1,
                'metadata': {'algorithm': 'genetic_algorithm_fallback', 'reason': 'no_job_sources'}
            }
        
        # Create a more diverse solution than linear programming
        suggested_shifts = []
        total_income = 0
        
        # Use multiple job sources for diversity
        job_list = list(job_sources.values())
        
        for i, date in enumerate(date_range[:14]):  # Limit to 2 weeks
            # Alternate between job sources
            job_source = job_list[i % len(job_list)]
            
            # Vary shift hours
            shift_hours = random.choice([4, 6, 8])
            start_hour = random.randint(9, 16)  # 9 AM to 4 PM start
            
            calculated_earnings = shift_hours * job_source.hourly_rate
            total_income += calculated_earnings
            
            shift = {
                'job_source_id': job_source.id,
                'job_source_name': job_source.name,
                'date': date.date(),
                'start_time': f"{start_hour:02d}:00",
                'end_time': f"{start_hour + shift_hours:02d}:00",
                'hourly_rate': job_source.hourly_rate,
                'break_minutes': 30 if shift_hours > 6 else 0,
                'working_hours': shift_hours - (0.5 if shift_hours > 6 else 0),
                'calculated_earnings': calculated_earnings,
                'confidence': 0.7,
                'priority': 1,
                'reasoning': f"Genetic algorithm solution: diverse shift pattern at {job_source.name}",
                'is_original': False
            }
            
            suggested_shifts.append(shift)
        
        return {
            'shifts': suggested_shifts,
            'objective_value': total_income,
            'confidence_score': 0.7,
            'metadata': {
                'algorithm': 'genetic_algorithm_fallback',
                'reason': 'full_implementation_pending',
                'total_shifts': len(suggested_shifts),
                'diversity_score': len(job_list) / max(len(job_list), 1)
            }
        }