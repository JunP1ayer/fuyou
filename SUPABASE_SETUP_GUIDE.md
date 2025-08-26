# Supabaseメール確認設定ガイド

## 🔧 必要な設定

現在のコードは完璧ですが、**Supabaseダッシュボード側でメール確認を有効化する必要があります**。

### 1. Supabaseダッシュボードでメール確認を有効化

1. **Supabaseダッシュボードにアクセス**:
   ```
   https://supabase.com/dashboard/project/rgcbixnrlrohwcbxylyg
   ```

2. **Authentication設定**:
   - 左サイドバーの「Authentication」→「Settings」をクリック
   - 「User Signups」セクションに移動

3. **メール確認を有効化**:
   ```
   ✅ Enable email confirmations: ON に設定
   ```

4. **確認URLの設定**:
   ```
   Site URL: http://localhost:4007 (開発時)
   Redirect URLs: 
   - http://localhost:4007/auth/callback
   - https://your-production-domain.com/auth/callback
   ```

### 2. メールテンプレートの設定

1. **Email Templatesに移動**:
   - 「Authentication」→「Email Templates」
   
2. **Confirm signupテンプレートを編集**:
   - `email-templates/signup-confirmation.html`の内容をコピー
   - Subject: `扶養管理カレンダー - アカウント確認のお願い`
   - テンプレートに貼り付けて保存

### 3. 現在の動作確認

**開発サーバー**: http://localhost:4007

**テストしてみてください**:

1. **新規登録**:
   - 新しいメールアドレスで登録
   - → メール確認画面が表示されるはずです

2. **既存ユーザー**:
   - 既に登録済みのメールで再登録
   - → "このメールアドレスは既に登録済みです" + 3秒後に自動でログイン画面に移動

## 🎯 実装済み機能

- ✅ 美しいメール確認画面UI
- ✅ メール再送機能（60秒制限）
- ✅ 既存ユーザー向けの親切なエラーメッセージ
- ✅ 自動的なログイン画面遷移
- ✅ プロフェッショナルなメールテンプレート
- ✅ レスポンシブデザイン
- ✅ アニメーション効果

## 🚀 今すぐテスト可能

現在のコードで以下をテストできます：

1. **UIの確認**: 新規登録→メール確認画面
2. **エラーハンドリング**: 既存メールでの登録
3. **再送機能**: メール再送ボタンと制限
4. **画面遷移**: 戻るボタン、自動遷移

Supabaseのメール確認設定を有効化すれば、完全に動作します！