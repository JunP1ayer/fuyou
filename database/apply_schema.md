# データベーススキーマ適用手順

## 1. Supabase SQLエディターでの実行

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **SQLエディターを開く**
   - 左サイドバーの「SQL Editor」をクリック
   - 「New query」をクリック

3. **スキーマ適用**
   ```sql
   -- demo_schema.sql の内容をコピー&ペーストして実行
   ```

## 2. CLI での適用（オプション）

```bash
# Supabase CLIがインストールされている場合
supabase db reset
supabase db push
```

## 3. 適用確認

実行後、以下で確認：

```sql
-- テーブル一覧確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- RLS状態確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'shifts', 'job_sources', 'incomes', 'dependents');
```

## 4. 適用後のテスト

スキーマ適用後、以下のAPIでテスト：

```bash
# シフト作成テスト
curl -X POST "http://localhost:3001/api/shifts" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobSourceName": "テストカフェ",
    "date": "2025-07-20",
    "startTime": "09:00",
    "endTime": "17:00",
    "hourlyRate": 1200,
    "breakMinutes": 60
  }'
```

## 5. 注意事項

- **デモ用設定**: RLSが無効化されています
- **本番環境**: 使用前にRLSを有効化してください
- **テストデータ**: デモユーザーが自動作成されます