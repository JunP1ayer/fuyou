# /deploy コマンド

Vercel (Frontend) + Railway (Backend) を使用したデプロイコマンド

## 使用方法

```
/deploy staging
/deploy production
```

## 実行内容

### 1. Frontend デプロイ (Vercel)

#### Staging環境

```bash
cd frontend
npm run build
npx vercel --prod --confirm
```

#### Production環境

```bash
cd frontend
npm run build
npx vercel --prod --confirm
```

### 2. Backend デプロイ (Railway)

#### 準備

```bash
cd backend
railway login
railway link
```

#### Staging環境

```bash
railway up --service fuyou-backend-staging
```

#### Production環境

```bash
railway up --service fuyou-backend-production
```

### 3. 環境変数設定

#### Frontend (.env.local)

```env
VITE_API_URL=https://api.fuyou.railway.app
VITE_MONEYTREE_CLIENT_ID=your_client_id
VITE_SENTRY_DSN=your_sentry_dsn
```

#### Backend (.env)

```env
DATABASE_URL=postgresql://user:pass@hostname:port/dbname
MONEYTREE_CLIENT_ID=your_client_id
MONEYTREE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
```

### 4. デプロイ前チェック

- [ ] すべてのテストが通過している
- [ ] TypeScript型チェック通過
- [ ] ESLint/Prettier適用済み
- [ ] 本番環境用の環境変数設定済み
- [ ] データベースマイグレーション完了
- [ ] セキュリティ設定確認

### 5. デプロイ後確認

- [ ] フロントエンドが正常に表示される
- [ ] バックエンドAPIが応答する
- [ ] 認証機能が動作する
- [ ] データベース接続が正常
- [ ] 外部API連携が機能する
- [ ] エラーログの確認

### 6. ロールバック手順

#### Vercel

```bash
vercel rollback
```

#### Railway

```bash
railway rollback
```

### 7. 監視・ログ確認

- **Vercel**: https://vercel.com/dashboard
- **Railway**: https://railway.app/dashboard
- **Sentry**: エラー監視
- **Uptime Robot**: サービス監視

### 8. 扶養アプリ特有の確認項目

- [ ] 銀行API連携の動作確認
- [ ] 扶養計算エンジンの正確性
- [ ] 個人情報保護機能の動作
- [ ] SSL証明書の有効性
- [ ] CORS設定の適切性
