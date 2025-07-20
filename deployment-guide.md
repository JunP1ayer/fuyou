# 扶養プロ - 安全なデプロイメントガイド

## 🔐 セキュリティ重視のデプロイメント手順

### 1. 事前準備

#### APIキーの安全な管理
```bash
# 1. .env ファイルを本番サーバーに作成
sudo nano /var/www/fuyou/.env

# 2. 適切な権限設定
sudo chmod 600 /var/www/fuyou/.env
sudo chown www-data:www-data /var/www/fuyou/.env
```

#### 必要なAPIキー
- **OpenAI API**: `your_openai_api_key_here`
- **Gemini API**: `your_gemini_api_key_here`

> ⚠️ 実際のAPIキーは管理者から別途提供されます

### 2. 推奨デプロイメント環境

#### A. Vercel（推奨）
```bash
# 1. Vercel CLI インストール
npm i -g vercel

# 2. 環境変数設定
vercel env add OPENAI_API_KEY
vercel env add GEMINI_API_KEY

# 3. デプロイ
vercel --prod
```

#### B. Netlify
```bash
# 1. Netlify CLI インストール
npm install -g netlify-cli

# 2. 環境変数設定（Netlify管理画面）
Site settings > Environment variables:
- OPENAI_API_KEY: [管理者提供のキー]
- GEMINI_API_KEY: [管理者提供のキー]

# 3. デプロイ
netlify deploy --prod
```

#### C. GitHub Pages + Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Environment
      run: |
        echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" >> .env
        echo "GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> .env
    
    - name: Build and Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

### 3. セキュリティ設定

#### HTTPS必須設定
```javascript
// secure-config-loader.js の設定で自動チェック
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.error('🚨 HTTPS接続が必要です');
    // 自動的にHTTPSにリダイレクト
    window.location.href = window.location.href.replace('http:', 'https:');
}
```

#### セキュリティヘッダー
```javascript
// サーバー設定例（Express.js）
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
```

### 4. 運用監視

#### APIキー使用量監視
```javascript
// 使用量トラッキング
const monitorAPIUsage = () => {
    const usage = secureConfig.monitorKeyUsage();
    
    // アラート設定
    if (usage.openai.requestCount > 1000) {
        console.warn('OpenAI API使用量が上限に近づいています');
    }
    
    if (usage.openai.errorCount > 10) {
        console.error('OpenAI APIエラーが多発しています');
    }
};

// 定期実行
setInterval(monitorAPIUsage, 300000); // 5分ごと
```

#### セキュリティ監査
```javascript
// 日次セキュリティチェック
const dailySecurityAudit = () => {
    const audit = secureConfig.auditSecurity();
    
    if (audit.securityLevel === 'low') {
        // 管理者に通知
        console.error('🚨 セキュリティレベル低下:', audit.issues);
        // 必要に応じて機能制限
        secureConfig.emergencyDisableKeys();
    }
};
```

### 5. バックアップとリカバリー

#### 設定バックアップ
```bash
# 1. 環境変数のバックアップ
cp .env .env.backup.$(date +%Y%m%d)

# 2. セキュアな場所への保存
gpg -c .env.backup.$(date +%Y%m%d)
mv .env.backup.$(date +%Y%m%d).gpg ~/secure-backups/
```

#### 緊急時の対応
```javascript
// 緊急時のキー無効化手順
const emergencyResponse = {
    // 1. 即座にキー無効化
    disableKeys: () => secureConfig.emergencyDisableKeys(),
    
    // 2. ユーザーへの通知
    notifyUsers: () => {
        alert('システムメンテナンス中です。しばらくお待ちください。');
    },
    
    // 3. ログ記録
    logIncident: (reason) => {
        console.error(`緊急停止: ${reason} at ${new Date().toISOString()}`);
    }
};
```

### 6. 本番環境の設定確認

#### 設定ファイル検証
```javascript
// 本番環境での設定検証
const validateProductionConfig = () => {
    const checks = [
        {
            name: 'HTTPS接続',
            check: () => window.location.protocol === 'https:',
            critical: true
        },
        {
            name: 'APIキー設定',
            check: () => secureConfig.getSecureKey('openai') !== null,
            critical: true
        },
        {
            name: 'セキュア設定',
            check: () => window.FUYOU_CONFIG.environment === 'production',
            critical: false
        }
    ];
    
    const failed = checks.filter(check => !check.check());
    const criticalFailed = failed.filter(check => check.critical);
    
    if (criticalFailed.length > 0) {
        console.error('🚨 重要な設定エラー:', criticalFailed.map(c => c.name));
        return false;
    }
    
    return true;
};
```

### 7. パフォーマンス最適化

#### CDN設定
```javascript
// 静的ファイルのCDN配信
const CDN_BASE = 'https://cdn.fuyou-pro.com';
const loadFromCDN = (file) => `${CDN_BASE}/${file}`;
```

#### キャッシュ戦略
```javascript
// Service Worker でのキャッシュ最適化
const CACHE_STRATEGY = {
    'api-calls': 'NetworkFirst',
    'static-assets': 'CacheFirst',
    'user-data': 'NetworkOnly'
};
```

### 8. 費用管理

#### APIコスト監視
```javascript
const costManagement = {
    // 月次予算設定
    monthlyBudget: 100, // USD
    
    // 使用量アラート
    alertThresholds: [50, 80, 95], // %
    
    // 自動制限
    autoLimit: true,
    
    // コスト計算
    calculateCosts: () => {
        const openaiCost = usage.openai.requestCount * 0.002; // 概算
        const geminiCost = usage.gemini.requestCount * 0.001; // 概算
        return openaiCost + geminiCost;
    }
};
```

### 9. 運用チェックリスト

#### デプロイ前確認
- [ ] APIキーの安全な設定
- [ ] HTTPS接続の確認
- [ ] セキュリティヘッダーの設定
- [ ] 環境変数の検証
- [ ] バックアップ設定の確認

#### 運用中監視
- [ ] API使用量の監視
- [ ] エラー率の確認
- [ ] パフォーマンス監視
- [ ] セキュリティ監査
- [ ] コスト管理

#### 緊急時対応
- [ ] キー無効化手順の確認
- [ ] バックアップからの復旧手順
- [ ] ユーザー通知方法
- [ ] 代替手段の準備

---

## 🚀 クイックデプロイ（推奨）

### Vercel での簡単デプロイ
```bash
# 1. リポジトリをクローン
git clone https://github.com/YourUsername/fuyou.git
cd fuyou

# 2. Vercel にデプロイ
npx vercel

# 3. 環境変数設定（Vercel ダッシュボード）
# OPENAI_API_KEY: [管理者提供のキー]
# GEMINI_API_KEY: [管理者提供のキー]

# 4. 本番デプロイ
npx vercel --prod
```

5分で本番環境が利用可能になります！