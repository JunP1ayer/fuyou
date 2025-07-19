-- Step 1: Create optimization_constraints table
CREATE TABLE IF NOT EXISTS optimization_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN (
        'max_weekly_hours', 'max_monthly_hours', 'min_monthly_income', 
        'max_monthly_income', 'fuyou_limit', 'custom'
    )),
    constraint_value DECIMAL(10,2) NOT NULL CHECK (constraint_value >= 0),
    constraint_unit VARCHAR(20) NOT NULL CHECK (constraint_unit IN (
        'hours', 'yen', 'percentage', 'custom'
    )),
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);