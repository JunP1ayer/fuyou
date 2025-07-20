# 扶養プロ 5.0 デプロイメントガイド

## 🚀 サーバーレス構成

### 1. Vercelでのデプロイ

#### 前提条件
- Vercelアカウント
- OpenAI APIキー または Gemini APIキー

#### デプロイ手順

1. **リポジトリをVercelに接続**
```bash
# GitHub/GitLabにプッシュ後
# Vercel Dashboard → New Project → Import Git Repository
```

2. **環境変数の設定**
```bash
# Vercel Dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=AIza-your-gemini-api-key-here
```

3. **ビルド設定**
```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "installCommand": "npm install"
}
```

4. **デプロイ完了**
- URL: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/openai-vision`

### 2. Netlifyでのデプロイ

#### 前提条件
- Netlifyアカウント
- APIキー

#### デプロイ手順

1. **Netlify Functions用設定**
```bash
# netlify.tomlファイル作成
[build]
  functions = "api"
  publish = "."

[functions]
  directory = "api"
```

2. **環境変数設定**
```bash
# Netlify Dashboard → Site Settings → Environment Variables
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=AIza-your-gemini-api-key-here
```

### 3. Cloudflare Workersでのデプロイ

#### 前提条件
- Cloudflareアカウント
- Wrangler CLI

#### デプロイ手順

1. **Wrangler設定**
```bash
npm install -g wrangler
wrangler login
```

2. **wrangler.tomlファイル作成**
```toml
name = "fuyou-pro-ai"
main = "src/worker.js"
compatibility_date = "2024-07-20"

[vars]
ENVIRONMENT = "production"
```

3. **シークレット設定**
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put GEMINI_API_KEY
```

## 🔧 設定ファイル

### 環境変数（.env）
```bash
# 必須
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=AIza-your-gemini-api-key-here

# オプション
MAX_REQUESTS_PER_HOUR=100
DAILY_COST_LIMIT_USD=10.00
ENABLE_USAGE_LOGGING=true
```

### APIキーの取得方法

#### OpenAI API
1. https://platform.openai.com/ にアクセス
2. API Keys → Create new secret key
3. `sk-...` で始まるキーをコピー

#### Gemini API  
1. https://makersuite.google.com/ にアクセス
2. Get API Key → Create API Key
3. `AIza...` で始まるキーをコピー

## 📊 監視・コスト管理

### 使用量監視
```javascript
// 使用状況ログ（自動出力）
{
  "timestamp": "2024-07-20T10:30:00Z",
  "api": "openai",
  "tokens_used": 1250,
  "shifts_detected": 3,
  "confidence": 0.95,
  "cost_estimate_usd": 0.025
}
```

### コスト制御
- **日次制限**: $10.00
- **月次制限**: $300.00  
- **レート制限**: 1時間100リクエスト

### アラート設定
```bash
# Webhook URL設定（Slack/Discord等）
WEBHOOK_URL_FOR_ALERTS=https://hooks.slack.com/...
```

## 🔒 セキュリティ

### APIキー管理
- 環境変数での管理（コードに直書き禁止）
- 定期的なキーローテーション推奨
- 最小権限の原則

### レート制限
```javascript
// IPベース制限
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15分
  max: 10 // 最大10リクエスト
};
```

### CORS設定
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## 🚦 本番運用

### パフォーマンス最適化
- 画像サイズ制限: 5MB
- API タイムアウト: 30秒
- 自動フォールバック: OpenAI → Gemini

### エラーハンドリング
```javascript
// 段階的フォールバック
1. OpenAI GPT-4o（高精度）
2. Gemini Pro Vision（高速・低コスト）
3. エラーメッセージ表示
```

### ログ収集
- API使用状況
- エラー率
- レスポンス時間
- コスト推移

## 📈 スケーリング

### トラフィック増加対応
1. **Vercel Pro**: より多くの関数実行時間
2. **Redis**: セッション・キャッシュ管理
3. **CDN**: 静的ファイル配信
4. **データベース**: シフトデータ永続化

### 機能拡張
- 複数ファイル同時処理
- バッチ処理機能
- 管理ダッシュボード
- 使用統計API

## 💰 コスト見積もり

### OpenAI GPT-4o
- 画像解析: ~$0.01-0.03/枚
- 月間100枚: ~$1-3

### Gemini Pro Vision
- 画像解析: ~$0.002-0.005/枚  
- 月間100枚: ~$0.2-0.5

### サーバーレス関数
- Vercel: 100GB-hours無料
- Netlify: 125,000リクエスト無料
- Cloudflare: 100,000リクエスト無料

## 🔍 トラブルシューティング

### よくある問題

1. **APIキーエラー**
```bash
# 確認方法
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

2. **CORS エラー**
```javascript
// 解決方法: プリフライトリクエスト対応
if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
```

3. **タイムアウト**
```javascript
// 解決方法: タイムアウト時間延長
{
  "maxDuration": 30
}
```

## 📞 サポート

- GitHub Issues: バグ報告・機能要望
- メール: support@fuyou-pro.com
- ドキュメント: https://docs.fuyou-pro.com