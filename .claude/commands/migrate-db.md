# /migrate-db コマンド

PostgreSQL + Supabase を使用したデータベースマイグレーションコマンド

## 使用方法

```
/migrate-db up
/migrate-db down
/migrate-db status
```

## 実行内容

### 1. マイグレーションの実行

#### Forward Migration (up)

```bash
cd backend
python -m alembic upgrade head
```

#### Rollback Migration (down)

```bash
cd backend
python -m alembic downgrade -1
```

#### Migration Status

```bash
cd backend
python -m alembic current
python -m alembic history
```

### 2. 新しいマイグレーションの生成

```bash
cd backend
python -m alembic revision --autogenerate -m "Add user table"
```

### 3. データベーススキーマ

#### Users テーブル

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_student BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Income Records テーブル

```sql
CREATE TABLE income_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    income_date DATE NOT NULL,
    source VARCHAR(255) NOT NULL,
    description TEXT,
    bank_transaction_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Dependence Settings テーブル

```sql
CREATE TABLE dependence_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    annual_limit DECIMAL(10, 2) NOT NULL DEFAULT 1030000,
    current_year INTEGER NOT NULL,
    alert_threshold DECIMAL(3, 2) DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Bank Connections テーブル

```sql
CREATE TABLE bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Supabase設定

#### RLS (Row Level Security)

```sql
-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users FOR ALL TO authenticated USING (auth.uid() = id);

-- Income records table
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY income_records_policy ON income_records FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Dependence settings table
ALTER TABLE dependence_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY dependence_settings_policy ON dependence_settings FOR ALL TO authenticated USING (auth.uid() = user_id);
```

#### Functions

```sql
-- Calculate annual income
CREATE OR REPLACE FUNCTION calculate_annual_income(user_uuid UUID, year INTEGER)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM income_records
        WHERE user_id = user_uuid
        AND EXTRACT(YEAR FROM income_date) = year
    );
END;
$$ LANGUAGE plpgsql;
```

### 5. 開発環境セットアップ

```bash
# PostgreSQL起動 (Docker)
docker run -d \
  --name fuyou-postgres \
  -e POSTGRES_DB=fuyou \
  -e POSTGRES_USER=fuyou \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Supabase CLI
npx supabase start
```

### 6. 本番環境マイグレーション

```bash
# Production database URL
export DATABASE_URL="postgresql://username:password@hostname:port/database"

# Run migrations
cd backend
python -m alembic upgrade head
```

### 7. バックアップ・リストア

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### 8. 扶養アプリ特有の考慮事項

- [ ] 個人情報の暗号化
- [ ] 金融データの適切な保存
- [ ] 年度切り替え処理
- [ ] データ保持期間の設定
- [ ] 監査ログの記録
