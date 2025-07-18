-- Phase 4: Optimization Algorithm Database Schema
-- This file contains the database schema for the optimization system

-- Enable Row Level Security for all tables
-- Note: RLS policies will be added after table creation

-- 1. Optimization Constraints Table
CREATE TABLE optimization_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN (
        'fuyou_limit', 'weekly_hours', 'daily_hours', 'availability', 
        'job_source_limit', 'minimum_income', 'break_constraints'
    )),
    constraint_value DECIMAL(10,2) NOT NULL CHECK (constraint_value >= 0),
    constraint_unit VARCHAR(20) NOT NULL CHECK (constraint_unit IN (
        'yen', 'hours', 'minutes', 'days', 'shifts', 'percentage'
    )),
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Optimization Runs Table
CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN (
        'maximize_income', 'minimize_hours', 'balance_sources', 'multi_objective'
    )),
    time_period_start DATE NOT NULL,
    time_period_end DATE NOT NULL,
    input_data JSONB NOT NULL DEFAULT '{}',
    result_data JSONB,
    execution_time_ms INTEGER CHECK (execution_time_ms >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    error_message TEXT,
    algorithm_used VARCHAR(50) DEFAULT 'linear_programming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Optimization Suggestions Table
CREATE TABLE optimization_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    suggested_shifts JSONB NOT NULL DEFAULT '[]',
    objective_value DECIMAL(10,2) NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL,
    constraints_satisfied JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,
    user_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Optimization Preferences Table
CREATE TABLE user_optimization_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_objective VARCHAR(50) DEFAULT 'maximize_income' CHECK (default_objective IN (
        'maximize_income', 'minimize_hours', 'balance_sources', 'multi_objective'
    )),
    optimization_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (optimization_frequency IN (
        'daily', 'weekly', 'bi_weekly', 'monthly', 'manual'
    )),
    auto_apply_suggestions BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "in_app": true,
        "push": false,
        "optimization_complete": true,
        "constraint_violation": true,
        "limit_approaching": true
    }',
    tier_level VARCHAR(20) DEFAULT 'free' CHECK (tier_level IN (
        'free', 'standard', 'pro'
    )),
    monthly_optimization_runs INTEGER DEFAULT 0,
    last_optimization_reset DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Availability Slots Table (for detailed availability constraints)
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    is_available BOOLEAN DEFAULT TRUE,
    job_source_id UUID REFERENCES job_sources(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_optimization_constraints_user_id ON optimization_constraints(user_id);
CREATE INDEX idx_optimization_constraints_type ON optimization_constraints(constraint_type);
CREATE INDEX idx_optimization_constraints_active ON optimization_constraints(is_active);

CREATE INDEX idx_optimization_runs_user_id ON optimization_runs(user_id);
CREATE INDEX idx_optimization_runs_status ON optimization_runs(status);
CREATE INDEX idx_optimization_runs_created_at ON optimization_runs(created_at);

CREATE INDEX idx_optimization_suggestions_user_id ON optimization_suggestions(user_id);
CREATE INDEX idx_optimization_suggestions_run_id ON optimization_suggestions(optimization_run_id);
CREATE INDEX idx_optimization_suggestions_applied ON optimization_suggestions(is_applied);

CREATE INDEX idx_user_optimization_preferences_user_id ON user_optimization_preferences(user_id);
CREATE INDEX idx_user_optimization_preferences_tier ON user_optimization_preferences(tier_level);

CREATE INDEX idx_availability_slots_user_id ON availability_slots(user_id);
CREATE INDEX idx_availability_slots_day_time ON availability_slots(day_of_week, start_time, end_time);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_optimization_constraints_updated_at 
    BEFORE UPDATE ON optimization_constraints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optimization_runs_updated_at 
    BEFORE UPDATE ON optimization_runs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optimization_suggestions_updated_at 
    BEFORE UPDATE ON optimization_suggestions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_optimization_preferences_updated_at 
    BEFORE UPDATE ON user_optimization_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at 
    BEFORE UPDATE ON availability_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE optimization_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_optimization_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own data
CREATE POLICY "Users can manage their own optimization constraints"
    ON optimization_constraints FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own optimization runs"
    ON optimization_runs FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own optimization suggestions"
    ON optimization_suggestions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own optimization preferences"
    ON user_optimization_preferences FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own availability slots"
    ON availability_slots FOR ALL
    USING (auth.uid() = user_id);

-- Insert default constraints for existing users (if any)
-- This should be run after the initial migration
INSERT INTO optimization_constraints (user_id, constraint_type, constraint_value, constraint_unit, priority)
SELECT 
    id as user_id,
    'fuyou_limit' as constraint_type,
    1500000 as constraint_value,
    'yen' as constraint_unit,
    1 as priority
FROM auth.users
WHERE id NOT IN (
    SELECT user_id FROM optimization_constraints WHERE constraint_type = 'fuyou_limit'
);

-- Insert default user preferences for existing users
INSERT INTO user_optimization_preferences (user_id)
SELECT id as user_id
FROM auth.users
WHERE id NOT IN (
    SELECT user_id FROM user_optimization_preferences
);

-- Add comments for documentation
COMMENT ON TABLE optimization_constraints IS 'Stores user-defined constraints for optimization algorithms';
COMMENT ON TABLE optimization_runs IS 'Tracks optimization algorithm executions and their results';
COMMENT ON TABLE optimization_suggestions IS 'Stores optimization suggestions generated by algorithms';
COMMENT ON TABLE user_optimization_preferences IS 'User preferences for optimization behavior and notifications';
COMMENT ON TABLE availability_slots IS 'Detailed availability constraints for specific time slots';

COMMENT ON COLUMN optimization_constraints.priority IS '1=hard constraint (must be satisfied), 2=soft constraint (preferred), 3=nice-to-have';
COMMENT ON COLUMN optimization_constraints.metadata IS 'Additional constraint-specific configuration (JSON)';
COMMENT ON COLUMN optimization_suggestions.confidence_score IS 'Algorithm confidence in the suggestion (0.0-1.0)';
COMMENT ON COLUMN user_optimization_preferences.tier_level IS 'Subscription tier affecting available features';