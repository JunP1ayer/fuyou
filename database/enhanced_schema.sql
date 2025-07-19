-- 扶養管理アプリ 拡張データベーススキーマ
-- Phase 1-3 対応版

-- 1. job_sources テーブル（バイト先管理）
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
    bank_account_info JSONB, -- 振込口座情報
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. incomes テーブル拡張
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS job_source_id UUID REFERENCES job_sources(id);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS is_auto_detected BOOLEAN DEFAULT false;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS detection_confidence DECIMAL(3,2);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS transaction_id TEXT; -- 銀行取引ID
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS raw_description TEXT; -- 生の取引摘要

-- 3. fuyou_calculations テーブル（計算履歴）
CREATE TABLE IF NOT EXISTS fuyou_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) NOT NULL,
    applicable_limits JSONB NOT NULL, -- 適用可能な制度一覧
    selected_limit_type TEXT NOT NULL,
    selected_limit_amount DECIMAL(10,2) NOT NULL,
    remaining_capacity DECIMAL(10,2) NOT NULL,
    monthly_target DECIMAL(10,2),
    risk_level TEXT CHECK (risk_level IN ('safe', 'warning', 'danger')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. smart_alerts テーブル（スマートアラート）
CREATE TABLE IF NOT EXISTS smart_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'monthly_target', 'yearly_projection', 'limit_approach', 
        'new_income_detected', 'schedule_optimization'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_suggestion TEXT,
    related_calculation_id UUID REFERENCES fuyou_calculations(id),
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 5. transaction_patterns テーブル（学習データ）
CREATE TABLE IF NOT EXISTS transaction_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_account_info TEXT,
    amount_range_min DECIMAL(10,2),
    amount_range_max DECIMAL(10,2),
    description_pattern TEXT, -- 正規表現パターン
    detected_job_source_id UUID REFERENCES job_sources(id),
    confidence DECIMAL(3,2) NOT NULL,
    learning_count INTEGER DEFAULT 1,
    last_matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. bank_connections テーブル（銀行連携情報）Phase 3用
CREATE TABLE IF NOT EXISTS bank_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('checking', 'savings', 'other')),
    masked_account_number TEXT, -- マスクされた口座番号
    external_connection_id TEXT, -- 外部API連携ID
    is_active BOOLEAN DEFAULT true,
    auto_sync_enabled BOOLEAN DEFAULT true,
    last_sync_date TIMESTAMP WITH TIME ZONE,
    sync_frequency_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 2025年制度対応の初期データ
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('fuyou_limits_2025', '{
  "student_dependent": {"amount": 1500000, "name": "学生特定扶養控除", "effective_date": "2025-01-01"},
  "basic_dependent": {"amount": 1230000, "name": "基本扶養控除", "effective_date": "2025-01-01"},
  "social_insurance": {"amount": 1300000, "name": "社会保険扶養", "effective_date": "2025-01-01"},
  "spouse_special": {"amount": 1600000, "name": "配偶者特別控除", "effective_date": "2025-01-01"}
}', '2025年度扶養控除限度額')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- 9. インデックス作成
CREATE INDEX IF NOT EXISTS idx_job_sources_user_id ON job_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_job_source_id ON incomes(job_source_id);
CREATE INDEX IF NOT EXISTS idx_fuyou_calculations_user_date ON fuyou_calculations(user_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_user_unread ON smart_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_transaction_patterns_user_id ON transaction_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_active ON bank_connections(user_id, is_active);

-- 10. RLSポリシー追加
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuyou_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Job sources policies
CREATE POLICY "Users can manage own job sources" ON job_sources
    FOR ALL USING (auth.uid() = user_id);

-- Fuyou calculations policies  
CREATE POLICY "Users can read own calculations" ON fuyou_calculations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON fuyou_calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Smart alerts policies
CREATE POLICY "Users can manage own alerts" ON smart_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Transaction patterns policies
CREATE POLICY "Users can manage own patterns" ON transaction_patterns
    FOR ALL USING (auth.uid() = user_id);

-- Bank connections policies
CREATE POLICY "Users can manage own bank connections" ON bank_connections
    FOR ALL USING (auth.uid() = user_id);

-- 11. 更新トリガー追加
CREATE TRIGGER update_job_sources_updated_at BEFORE UPDATE ON job_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_patterns_updated_at BEFORE UPDATE ON transaction_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_connections_updated_at BEFORE UPDATE ON bank_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 便利な関数
-- 月間収入計算関数
CREATE OR REPLACE FUNCTION calculate_monthly_income(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) 
         FROM incomes 
         WHERE user_id = p_user_id 
           AND EXTRACT(YEAR FROM income_date) = p_year
           AND EXTRACT(MONTH FROM income_date) = p_month),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 年間収入計算関数
CREATE OR REPLACE FUNCTION calculate_yearly_income(
    p_user_id UUID,
    p_year INTEGER
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) 
         FROM incomes 
         WHERE user_id = p_user_id 
           AND EXTRACT(YEAR FROM income_date) = p_year),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- スマートアラート生成関数
CREATE OR REPLACE FUNCTION generate_smart_alert(
    p_user_id UUID,
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_action_suggestion TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO smart_alerts (
        user_id, alert_type, severity, title, message, action_suggestion
    ) VALUES (
        p_user_id, p_alert_type, p_severity, p_title, p_message, p_action_suggestion
    ) RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;