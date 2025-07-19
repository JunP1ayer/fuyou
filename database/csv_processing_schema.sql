-- CSV処理用のデータベーススキーマ拡張

-- CSVアップロード履歴テーブル
CREATE TABLE IF NOT EXISTS csv_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    bank_type TEXT NOT NULL,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    income_transactions INTEGER NOT NULL DEFAULT 0,
    saved_incomes INTEGER NOT NULL DEFAULT 0,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB
);

-- CSV処理エラーテーブル
CREATE TABLE IF NOT EXISTS csv_processing_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID REFERENCES csv_uploads(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    row_number INTEGER,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 収入検出ルールテーブル（機械学習の改善用）
CREATE TABLE IF NOT EXISTS income_detection_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence_weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存のincomesテーブルにmetadataカラムを追加（存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incomes' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE incomes ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_csv_uploads_user_id ON csv_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_upload_date ON csv_uploads(upload_date);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_bank_type ON csv_uploads(bank_type);

CREATE INDEX IF NOT EXISTS idx_csv_errors_upload_id ON csv_processing_errors(upload_id);
CREATE INDEX IF NOT EXISTS idx_csv_errors_type ON csv_processing_errors(error_type);

CREATE INDEX IF NOT EXISTS idx_income_rules_keyword ON income_detection_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_income_rules_category ON income_detection_rules(category);
CREATE INDEX IF NOT EXISTS idx_income_rules_active ON income_detection_rules(is_active);

-- 収入検出ルールの初期データ挿入
INSERT INTO income_detection_rules (keyword, category, confidence_weight) VALUES
('給与', 'salary', 1.0),
('給料', 'salary', 1.0),
('アルバイト', 'part_time', 1.0),
('バイト', 'part_time', 1.0),
('振込', 'transfer', 0.8),
('入金', 'deposit', 0.7),
('報酬', 'fee', 0.9),
('賞与', 'bonus', 1.0),
('ボーナス', 'bonus', 1.0),
('時給', 'hourly', 0.9),
('日給', 'daily', 0.9),
('月給', 'monthly', 0.9),
('コンビニ', 'convenience_store', 0.8),
('マクドナルド', 'fast_food', 0.8),
('スタバ', 'cafe', 0.8),
('塾', 'tutoring', 0.8),
('配達', 'delivery', 0.8)
ON CONFLICT DO NOTHING;

-- 更新時刻の自動更新トリガー関数（既存のものを使用）
CREATE TRIGGER update_income_rules_updated_at BEFORE UPDATE ON income_detection_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CSVアップロード統計を取得するビュー
CREATE OR REPLACE VIEW csv_upload_stats AS
SELECT 
    user_id,
    COUNT(*) as total_uploads,
    SUM(total_transactions) as total_transactions_processed,
    SUM(income_transactions) as total_income_transactions,
    SUM(saved_incomes) as total_saved_incomes,
    AVG(CASE WHEN total_transactions > 0 THEN income_transactions::float / total_transactions ELSE 0 END) as avg_detection_rate,
    MIN(upload_date) as first_upload,
    MAX(upload_date) as last_upload
FROM csv_uploads
WHERE status = 'completed'
GROUP BY user_id;

-- バイト先別収入統計ビュー
CREATE OR REPLACE VIEW income_by_source AS
SELECT 
    user_id,
    source,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(income_date) as first_income,
    MAX(income_date) as last_income,
    COUNT(DISTINCT DATE_TRUNC('month', income_date)) as active_months
FROM incomes
GROUP BY user_id, source
ORDER BY total_amount DESC;

-- 月別収入推移ビュー
CREATE OR REPLACE VIEW monthly_income_trend AS
SELECT 
    user_id,
    DATE_TRUNC('month', income_date) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT source) as unique_sources,
    AVG(amount) as avg_transaction_amount
FROM incomes
GROUP BY user_id, DATE_TRUNC('month', income_date)
ORDER BY user_id, month;