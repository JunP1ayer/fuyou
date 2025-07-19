-- Step 4: Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_optimization_constraints_user_id ON optimization_constraints(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_runs_user_id ON optimization_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_optimization_preferences_user_id ON user_optimization_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_user_id ON availability_slots(user_id);