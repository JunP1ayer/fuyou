-- Create shifts table for shift management
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_source_id UUID,
  job_source_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  working_hours DECIMAL(5,2) NOT NULL,
  calculated_earnings DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_job_source ON shifts(job_source_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own shifts
CREATE POLICY shifts_user_policy ON shifts
  FOR ALL USING (user_id = auth.uid());

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_shifts_updated_at_trigger
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_shifts_updated_at();

-- Grant necessary permissions
GRANT ALL ON shifts TO authenticated;
GRANT ALL ON shifts TO anon;