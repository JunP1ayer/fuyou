-- Fix column name mismatch in user_optimization_preferences table
-- The backend expects 'auto_apply_suggestions' but table has 'auto_optimize'

ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS auto_apply_suggestions BOOLEAN DEFAULT FALSE;

-- Copy data from auto_optimize to auto_apply_suggestions if needed
UPDATE user_optimization_preferences 
SET auto_apply_suggestions = auto_optimize 
WHERE auto_apply_suggestions IS NULL;

-- Also add any other missing columns the backend might expect
ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS tier_level VARCHAR(20) DEFAULT 'free';

ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS monthly_optimization_runs INTEGER DEFAULT 0;

ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS last_optimization_reset DATE DEFAULT CURRENT_DATE;

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_optimization_preferences' 
ORDER BY ordinal_position;