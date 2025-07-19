-- 扶養管理アプリ データベーススキーマ
-- Supabase SQL Editor で実行してください

-- 1. users テーブル作成
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    is_student BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. incomes テーブル作成
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    income_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. dependents テーブル作成（扶養設定）
CREATE TABLE IF NOT EXISTS dependents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    annual_limit DECIMAL(10,2) DEFAULT 1030000.00, -- 扶養控除限度額（103万円）
    current_year INTEGER NOT NULL,
    alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- アラート閾値（80%）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_income_date ON incomes(income_date);
CREATE INDEX IF NOT EXISTS idx_dependents_user_id ON dependents(user_id);
CREATE INDEX IF NOT EXISTS idx_dependents_current_year ON dependents(current_year);

-- 5. RLS（Row Level Security）設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシー作成
-- Users: 自分の情報のみアクセス可能
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Incomes: 自分の収入データのみアクセス可能
CREATE POLICY "Users can read own incomes" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes" ON incomes
    FOR DELETE USING (auth.uid() = user_id);

-- Dependents: 自分の扶養設定のみアクセス可能
CREATE POLICY "Users can read own dependents" ON dependents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dependents" ON dependents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dependents" ON dependents
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. 更新時刻の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 更新時刻の自動更新トリガー
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependents_updated_at BEFORE UPDATE ON dependents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 初期データ挿入用関数（オプション）
CREATE OR REPLACE FUNCTION create_user_with_dependent(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_is_student BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- ユーザー作成
    INSERT INTO users (id, email, full_name, is_student)
    VALUES (p_user_id, p_email, p_full_name, p_is_student)
    RETURNING id INTO v_user_id;
    
    -- 扶養設定の初期値を作成
    INSERT INTO dependents (user_id, current_year)
    VALUES (v_user_id, EXTRACT(YEAR FROM CURRENT_DATE));
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;