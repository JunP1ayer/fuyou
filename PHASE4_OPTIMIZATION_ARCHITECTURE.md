# Phase 4: Optimization Algorithm Architecture Design

## 🎯 Overview
This document outlines the architecture for implementing shift optimization algorithms in the fuyou management app, enabling users to maximize income while staying within fuyou (dependency) limits.

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Optimization   │  │  Shift          │  │  Settings       │ │
│  │  Dashboard      │  │  Suggestions    │  │  & Constraints  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Node.js Backend (Express + TypeScript)           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Optimization   │  │  Constraint     │  │  Monetization   │ │
│  │  API Routes     │  │  Management     │  │  Tiers          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Python Optimization Service                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  scipy.optimize │  │  Constraint     │  │  Algorithm      │ │
│  │  Linear Prog    │  │  Solver         │  │  Coordinator    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase Database                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Optimization   │  │  Suggestions    │  │  User           │ │
│  │  Constraints    │  │  History        │  │  Preferences    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### 1. Python Optimization Service

#### Core Dependencies
```python
# requirements.txt
scipy>=1.11.0
numpy>=1.24.0
pandas>=2.0.0
fastapi>=0.104.0
pydantic>=2.4.0
uvicorn>=0.24.0
python-dotenv>=1.0.0
httpx>=0.25.0
```

#### Service Structure
```
optimization_service/
├── main.py              # FastAPI application
├── models/
│   ├── constraints.py   # Constraint models
│   ├── objectives.py    # Objective function models
│   └── optimization.py  # Core optimization models
├── algorithms/
│   ├── linear_programming.py    # Linear programming solver
│   ├── genetic_algorithm.py     # Genetic algorithm implementation
│   └── multi_objective.py       # Multi-objective optimization
├── services/
│   ├── optimizer.py     # Main optimization service
│   ├── constraint_manager.py  # Constraint management
│   └── solution_validator.py  # Solution validation
└── utils/
    ├── data_processor.py  # Data preprocessing
    └── result_formatter.py # Result formatting
```

### 2. Optimization Objectives

#### Primary Objectives
1. **Maximize Income**: Maximize total earnings within fuyou limits
2. **Minimize Working Hours**: Achieve target income with minimal time investment
3. **Balance Job Sources**: Distribute shifts across multiple job sources
4. **Risk Minimization**: Reduce risk of exceeding fuyou limits

#### Mathematical Formulation
```python
# Primary objective function
def maximize_income(shifts, constraints):
    return sum(shift.hourly_rate * shift.duration for shift in shifts)

# Subject to constraints:
# 1. Fuyou limit: sum(earnings) <= fuyou_limit
# 2. Time constraints: sum(hours) <= max_weekly_hours
# 3. Availability: shifts must be within available time slots
# 4. Job source limits: shifts per job source <= max_shifts
```

### 3. Constraint System

#### Constraint Types
```python
class ConstraintType(Enum):
    FUYOU_LIMIT = "fuyou_limit"           # Annual income limit
    WEEKLY_HOURS = "weekly_hours"         # Maximum weekly working hours
    DAILY_HOURS = "daily_hours"           # Maximum daily working hours
    AVAILABILITY = "availability"         # Time slot availability
    JOB_SOURCE_LIMIT = "job_source_limit" # Shifts per job source
    MINIMUM_INCOME = "minimum_income"     # Minimum monthly income target
    BREAK_CONSTRAINTS = "break_constraints" # Minimum break between shifts
```

#### Constraint Model
```python
@dataclass
class OptimizationConstraint:
    id: str
    type: ConstraintType
    value: float
    unit: str  # hours, yen, days, etc.
    priority: int  # 1=hard constraint, 2=soft constraint
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 4. Database Schema

#### New Tables
```sql
-- Optimization constraints
CREATE TABLE optimization_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    constraint_type VARCHAR(50) NOT NULL,
    constraint_value DECIMAL(10,2) NOT NULL,
    constraint_unit VARCHAR(20) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization suggestions
CREATE TABLE optimization_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    optimization_run_id UUID NOT NULL,
    suggested_shifts JSONB NOT NULL,
    objective_value DECIMAL(10,2) NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL,
    constraints_satisfied JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization runs
CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    objective_type VARCHAR(50) NOT NULL,
    time_period_start DATE NOT NULL,
    time_period_end DATE NOT NULL,
    input_data JSONB NOT NULL,
    result_data JSONB,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User optimization preferences
CREATE TABLE user_optimization_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    default_objective VARCHAR(50) DEFAULT 'maximize_income',
    optimization_frequency VARCHAR(20) DEFAULT 'weekly',
    auto_apply_suggestions BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB,
    tier_level VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. API Endpoints

#### Optimization Routes
```typescript
// POST /api/optimization/run
interface OptimizationRequest {
    objective: 'maximize_income' | 'minimize_hours' | 'balance_sources';
    timeRange: {
        start: string;
        end: string;
    };
    constraints: OptimizationConstraint[];
    preferences: {
        algorithm: 'linear_programming' | 'genetic_algorithm';
        maxIterations: number;
        timeout: number;
    };
}

// GET /api/optimization/suggestions/{runId}
interface OptimizationSuggestion {
    id: string;
    suggestedShifts: SuggestedShift[];
    objectiveValue: number;
    constraintsSatisfied: boolean;
    confidenceScore: number;
    metadata: {
        algorithm: string;
        executionTime: number;
        iterationsUsed: number;
    };
}

// POST /api/optimization/constraints
interface ConstraintRequest {
    type: ConstraintType;
    value: number;
    unit: string;
    priority: number;
}
```

### 6. Python Service Integration

#### FastAPI Service
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import scipy.optimize as optimize
import numpy as np

app = FastAPI(title="Fuyou Optimization Service")

class OptimizationRequest(BaseModel):
    user_id: str
    objective: str
    time_range: Dict[str, str]
    constraints: List[Dict[str, Any]]
    job_sources: List[Dict[str, Any]]
    availability: List[Dict[str, Any]]

@app.post("/optimize")
async def optimize_shifts(request: OptimizationRequest):
    try:
        # Initialize optimization problem
        optimizer = ShiftOptimizer(request)
        
        # Solve optimization problem
        solution = optimizer.solve()
        
        # Validate solution
        if not optimizer.validate_solution(solution):
            raise HTTPException(400, "Invalid solution generated")
        
        return {
            "success": True,
            "solution": solution,
            "objective_value": optimizer.get_objective_value(solution),
            "execution_time": optimizer.execution_time
        }
    except Exception as e:
        raise HTTPException(500, f"Optimization failed: {str(e)}")
```

#### Node.js Integration
```typescript
// backend/src/services/optimizationService.ts
import axios from 'axios';

export class OptimizationService {
    private pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    async runOptimization(request: OptimizationRequest): Promise<OptimizationResult> {
        try {
            const response = await axios.post(`${this.pythonServiceUrl}/optimize`, request, {
                timeout: 30000 // 30 second timeout
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`Optimization service error: ${error.message}`);
        }
    }
    
    async validateConstraints(constraints: OptimizationConstraint[]): Promise<boolean> {
        // Validate constraints before sending to Python service
        return true;
    }
}
```

## 🎯 Optimization Algorithms

### 1. Linear Programming (Primary)
- **Use Case**: Maximize income with linear constraints
- **Algorithm**: scipy.optimize.linprog
- **Advantages**: Fast, guaranteed global optimum
- **Suitable for**: Free tier users

### 2. Genetic Algorithm (Advanced)
- **Use Case**: Complex multi-objective optimization
- **Algorithm**: Custom implementation with scipy.optimize.differential_evolution
- **Advantages**: Handles non-linear objectives, multiple optima
- **Suitable for**: Standard/Pro tier users

### 3. Multi-Objective Optimization (Premium)
- **Use Case**: Balance income, hours, and other objectives
- **Algorithm**: NSGA-II or similar
- **Advantages**: Pareto-optimal solutions
- **Suitable for**: Pro tier users

## 💰 Monetization Tiers

### Free Tier
- Basic linear programming optimization
- 5 optimization runs per month
- Standard constraints (fuyou limit, weekly hours)
- Email notifications

### Standard Tier (¥500/month)
- All Free tier features
- Advanced algorithms (genetic algorithm)
- 50 optimization runs per month
- Custom constraints
- Real-time notifications
- Export optimization results

### Pro Tier (¥1,200/month)
- All Standard tier features
- Multi-objective optimization
- Unlimited optimization runs
- Advanced analytics and reporting
- API access
- Priority support
- Custom algorithm parameters

## 🔄 Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up Python FastAPI service
- [ ] Implement basic linear programming solver
- [ ] Create database schema
- [ ] Basic API integration

### Week 3-4: Core Features
- [ ] Implement constraint management system
- [ ] Create optimization dashboard UI
- [ ] Add shift suggestion components
- [ ] Implement basic monetization tiers

### Week 5-6: Advanced Features
- [ ] Add genetic algorithm implementation
- [ ] Create analytics dashboard
- [ ] Implement user preference system
- [ ] Add optimization history tracking

### Week 7-8: Polish & Testing
- [ ] Performance optimization
- [ ] Error handling and validation
- [ ] User testing and feedback
- [ ] Documentation and deployment

## 🎨 User Experience Flow

1. **Setup**: User configures constraints and preferences
2. **Optimization**: System generates optimal shift schedule
3. **Review**: User reviews and modifies suggestions
4. **Application**: User applies optimized schedule
5. **Monitoring**: System tracks performance and adjusts

## 📊 Success Metrics

- **User Engagement**: Optimization runs per user per month
- **Income Optimization**: Average income increase per user
- **Time Efficiency**: Reduction in working hours for same income
- **Fuyou Compliance**: Percentage of users staying within limits
- **Conversion Rate**: Free to paid tier conversion

This architecture provides a scalable foundation for implementing sophisticated optimization algorithms while maintaining the existing system's integrity and user experience.