-- 扶養管理アプリ デモ用データベーススキーマ
-- RLS無効化版（開発・デモ用）
-- 重複トリガーエラー対応版

-- 1. usersテーブル（存在しない場合のみ作成）
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    is_student BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. incomesテーブル（存在しない場合のみ作成）
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    income_date DATE NOT NULL,
    job_source_id UUID,
    category TEXT DEFAULT 'other',
    is_auto_detected BOOLEAN DEFAULT false,
    detection_confidence DECIMAL(3,2),
    transaction_id TEXT,
    raw_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. job_sourcesテーブル（バイト先管理）
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'part_time_job', 'temporary_work', 'freelance', 
        'scholarship', 'family_support', 'other'
    )),
    hourly_rate DECIMAL(8,2),
    expected_monthly_hours INTEGER,
    bank_account_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. shiftsテーブル（シフト管理）
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_source_id UUID REFERENCES job_sources(id),
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

-- 5. dependentsテーブル（扶養設定）
CREATE TABLE IF NOT EXISTS dependents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    annual_limit DECIMAL(10,2) DEFAULT 1500000.00,
    current_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    alert_threshold DECIMAL(3,2) DEFAULT 0.80,
    limit_type TEXT DEFAULT 'student_dependent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_job_source ON shifts(job_source_id);
CREATE INDEX IF NOT EXISTS idx_job_sources_user_id ON job_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(income_date);

-- 更新時刻の自動更新関数（存在しない場合のみ作成）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存トリガーを削除してから再作成
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
DROP TRIGGER IF EXISTS update_job_sources_updated_at ON job_sources;
DROP TRIGGER IF EXISTS update_dependents_updated_at ON dependents;

-- 更新時刻の自動更新トリガー
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_sources_updated_at BEFORE UPDATE ON job_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependents_updated_at BEFORE UPDATE ON dependents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デモ用: RLS無効化（開発・テスト用）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE dependents DISABLE ROW LEVEL SECURITY;

-- 権限付与
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON incomes TO authenticated;
GRANT ALL ON incomes TO anon;
GRANT ALL ON job_sources TO authenticated;
GRANT ALL ON job_sources TO anon;
GRANT ALL ON shifts TO authenticated;
GRANT ALL ON shifts TO anon;
GRANT ALL ON dependents TO authenticated;
GRANT ALL ON dependents TO anon;

-- デモ用テストデータ
INSERT INTO users (id, email, full_name, is_student) VALUES 
('a32bdc9e-ae5c-4923-809a-ac88f848cc4e', 'test@example.com', 'テストユーザー', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dependents (user_id, annual_limit, current_year) VALUES 
('a32bdc9e-ae5c-4923-809a-ac88f848cc4e', 1500000, 2025)
ON CONFLICT DO NOTHING;

-- 初期データの確認
SELECT 'Schema applied successfully. Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'shifts', 'job_sources', 'incomes', 'dependents')
ORDER BY table_name;