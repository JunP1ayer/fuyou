-- Additional column fixes for user_optimization_preferences table
-- Backend expects these columns but they don't exist in the table

ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS default_objective VARCHAR(50) DEFAULT 'maximize_income';

ALTER TABLE user_optimization_preferences 
ADD COLUMN IF NOT EXISTS optimization_frequency VARCHAR(20) DEFAULT 'weekly';

-- Check what columns we currently have
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_optimization_preferences' 
ORDER BY ordinal_position;