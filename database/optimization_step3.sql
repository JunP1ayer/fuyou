-- Step 3: Create user_optimization_preferences table
CREATE TABLE IF NOT EXISTS user_optimization_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    preferred_algorithm VARCHAR(50) DEFAULT 'linear_programming',
    optimization_goal VARCHAR(50) DEFAULT 'maximize_income',
    risk_tolerance VARCHAR(20) DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    time_horizon VARCHAR(20) DEFAULT 'medium' CHECK (time_horizon IN ('short', 'medium', 'long')),
    auto_optimize BOOLEAN DEFAULT FALSE,
    notification_settings JSONB DEFAULT '{
        "new_recommendations": true,
        "weekly_reports": false,
        "monthly_reports": true,
        "risk_alerts": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);