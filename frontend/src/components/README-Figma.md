# 🎨 Figma連携機能

扶養管理アプリにFigmaとの連携機能を追加し、デザインシステムの自動同期とコンポーネント管理を実現。

## 📋 実装機能

### 🔧 核心機能
- **デザイントークン自動取得**: カラー・タイポグラフィ・スペーシングの自動同期
- **コンポーネント情報取得**: Figmaコンポーネントのメタデータとサムネイル
- **CSS/TypeScript出力**: デザイントークンのコード生成
- **リアルタイム同期**: 手動・自動リフレッシュ対応
- **キャッシュシステム**: パフォーマンス最適化

### 🎯 対応API機能
- **Figma REST API v1**: 最新仕様準拠
- **Variables API**: Enterprise限定デザイントークン（フォールバック対応）
- **Components API**: コンポーネント情報とメタデータ
- **Images API**: コンポーネントサムネイル取得
- **エラーハンドリング**: レート制限・認証エラー対応

## 🏗️ アーキテクチャ

### ファイル構成
```
frontend/src/
├── services/
│   └── figmaService.ts          # Figma API統合サービス
├── hooks/
│   └── useFigma.ts             # React Hooks (6種類)
├── components/
│   ├── FigmaIntegration.tsx    # メインUI
│   └── FigmaSettingsDialog.tsx # 設定ウィザード
└── types/
    ├── figma.ts                # 型定義
    └── figma-api.d.ts          # APIライブラリ型定義
```

### React Hooks
1. **useFigmaFile**: ファイル情報取得
2. **useFigmaDesignTokens**: デザイントークン管理
3. **useFigmaComponents**: コンポーネント一覧
4. **useFigmaComponentImage**: サムネイル取得
5. **useFigmaPrototype**: プロトタイプ情報（準備中）
6. **useFigmaIntegration**: 統合管理
7. **useFigmaConfig**: 設定管理・永続化

## 🔑 設定手順

### 1. Personal Access Token 取得
```
1. Figma → Settings → Personal access tokens
2. "New token" クリック
3. トークン名入力（例: "扶養管理アプリ"）
4. 生成されたトークンをコピー
```

### 2. File Key 取得
```
FigmaファイルURL:
https://www.figma.com/file/[FILE_KEY]/design-system

FILE_KEYの部分を抽出
```

### 3. 連携開始
- ダッシュボード → "Figma連携" タブ
- 設定情報を入力
- 接続テスト実行
- 自動同期開始

## 💡 使用方法

### デザイントークンの取得
```typescript
// カスタムフック使用例
const { tokens, loading, error, refetch } = useFigmaDesignTokens(config, true);

// CSS変数として出力
const cssVariables = figmaService.tokensToCSS(tokens);

// TypeScript定数として出力
const tsTokens = figmaService.tokensToTypeScript(tokens);
```

### CSS変数出力例
```css
:root {
  --color-primary: rgb(103, 126, 234);
  --color-secondary: rgb(118, 75, 162);
  --font-heading-family: Inter;
  --font-heading-size: 24px;
  --font-heading-weight: 600;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

### TypeScript定数出力例
```typescript
export const designTokens = {
  colors: {
    primary: "rgb(103, 126, 234)",
    secondary: "rgb(118, 75, 162)"
  },
  typography: {
    heading: {
      fontFamily: "Inter",
      fontSize: "24px",
      fontWeight: 600
    }
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px"
  },
  lastUpdated: "2025-01-21T06:15:00.000Z"
} as const;
```

## ⚡ パフォーマンス最適化

### キャッシュ戦略
- **メモリキャッシュ**: 5分間TTL
- **ローカルストレージ**: 設定情報永続化
- **差分更新**: 変更時のみデータ取得

### レート制限対応
```typescript
// Personal Access Token制限
- Files: 120 requests/minute, 24,000 requests/day
- Images: 55秒タイムアウト
- Variables: 10 requests/minute (Enterprise)

// 自動リトライ機構
const handleRateLimit = async (apiCall) => {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      await delay((retryAfter || 60) * 1000);
      return handleRateLimit(apiCall);
    }
    throw error;
  }
};
```

## 🔐 セキュリティ

### トークン管理
- **暗号化保存**: ローカルストレージで安全な保存
- **表示制御**: UI上でのトークンマスキング
- **スコープ制限**: 最小限必要な権限のみ

### Enterprise機能対応
- **Variables API**: 利用可能時は優先使用
- **フォールバック**: Styles APIで代替処理
- **権限チェック**: アクセス可否の自動判定

## 📊 対応ファイル形式

### Variables API (Enterprise)
```
✅ カラー変数 (COLOR)
✅ 数値変数 (FLOAT) - スペーシング等
✅ 文字列変数 (STRING)
✅ ブール変数 (BOOLEAN)
```

### Styles API (標準)
```
✅ Fill Styles - カラー
✅ Text Styles - タイポグラフィ
✅ Effect Styles - シャドウ等
✅ Grid Styles - レイアウト
```

### コンポーネント
```
✅ Component Sets - バリアント対応
✅ Individual Components
✅ Component Instances
✅ Metadata & Descriptions
```

## 🚀 今後の拡張計画

### Phase 2: プロトタイプ同期
- フロー情報の取得
- インタラクション詳細
- 画面遷移マップ生成

### Phase 3: 自動コード生成
- React コンポーネント生成
- Storybook統合
- デザインシステム同期

### Phase 4: CI/CD統合
- GitHub Actions連携
- 自動PR作成
- デザイン変更通知

## 🛠️ トラブルシューティング

### よくある問題

**接続エラー**
```
- Personal Access Tokenの確認
- File Keyの形式確認
- ネットワーク接続確認
```

**Variables API未対応**
```
- Enterprise プランが必要
- Styles API自動フォールバック
- 機能制限なし
```

**レート制限**
```
- 自動リトライ機構
- キャッシュ活用
- 同期間隔の調整
```

## 🎉 導入効果

### 開発効率向上
- ✅ デザイン変更の自動反映
- ✅ 手動CSS更新作業削減
- ✅ デザイナー・開発者間の連携強化

### 品質向上
- ✅ デザインシステム一貫性
- ✅ 型安全なトークン管理
- ✅ 自動テスト対応

### メンテナンス性
- ✅ 単一情報源 (Single Source of Truth)
- ✅ 変更履歴トラッキング
- ✅ バージョン管理統合

---

**実装完了日**: 2025-01-21  
**対応バージョン**: Figma API v1.104  
**TypeScript対応**: ✅ 完全型安全  
**React Hooks**: ✅ 7種類実装  
**Enterprise対応**: ✅ Variables API + フォールバック