# 🔐 Supabase 認証セットアップ手順

## 1. Supabase プロジェクト作成

1. https://supabase.com にアクセス
2. 「New project」でプロジェクト作成
   - Project name: `fuyou-pro`
   - Password: 安全なパスワードを設定
   - Region: `Northeast Asia (Tokyo)`

## 2. 認証設定

1. ダッシュボードで「Authentication」→「Settings」
2. 以下を設定：
   - **Site URL**: `http://localhost:4003` (開発用)
   - **Redirect URLs**: `http://localhost:4003/**`
   - **Confirm email**: 無効化（開発時）
   - **Enable email confirmations**: OFF

## 3. データベーステーブル作成

1. ダッシュボードで「SQL Editor」を開く
2. `database/auth_schema.sql` のSQLを全て実行
3. プロフィールテーブルとRLS（行レベルセキュリティ）が設定される

## 4. 環境変数設定

1. ダッシュボードで「Settings」→「API」を開く
2. 以下の値を確認：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...` (長いJWT)

3. `frontend/.env` ファイルを更新：
```bash
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## 5. テスト手順

1. 開発サーバー起動：
```bash
cd frontend && npm run dev
```

2. ブラウザで http://localhost:4003 にアクセス
3. ログイン画面が表示される
4. 「新規登録」タブで：
   - 名前: `テストユーザー`
   - メールアドレス: `test@example.com`
   - パスワード: `TestPass123!`
5. 「アカウント作成」をクリック
6. ログイン成功後、メインアプリに遷移

## 6. Supabase ダッシュボードで確認

- **Authentication** → **Users**: 作成したユーザーが表示
- **Table Editor** → **profiles**: プロフィール情報が自動作成

## 7. 本番環境設定

Vercel等にデプロイ時は：
1. 環境変数を本番用プラットフォームに設定
2. Supabase の Site URL を本番URLに変更
3. Redirect URLs に本番URLを追加

## トラブルシューティング

### エラー: "Invalid login credentials"
- メール/パスワードが正しいか確認
- Supabase ダッシュボードでユーザーが作成されているか確認

### エラー: "Database connection error"
- VITE_SUPABASE_URL が正しいか確認
- VITE_SUPABASE_ANON_KEY が正しいか確認

### RLS エラー
- `database/auth_schema.sql` のポリシーが正しく適用されているか確認
- Supabase ダッシュボードで「Authentication」→「Policies」を確認

## セキュリティ注意事項

- ⚠️ `.env` ファイルは Git にコミットしない
- 🔐 本番環境では必ずメール確認を有効化
- 🛡️ パスワード強度要件を適切に設定
- 📧 Supabase の Auth メール設定を本番用に変更