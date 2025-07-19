-- Step 2: Create optimization_runs table
CREATE TABLE IF NOT EXISTS optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN (
        'maximize_income', 'minimize_hours', 'balance_sources', 'minimize_risk', 'multi_objective'
    )),
    time_period_start DATE NOT NULL,
    time_period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed'
    )),
    progress DECIMAL(3,2) DEFAULT 0.0 CHECK (progress BETWEEN 0 AND 1),
    message TEXT DEFAULT 'Optimization queued',
    algorithm_used VARCHAR(50) DEFAULT 'linear_programming',
    estimated_completion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);