# 扶養管理アプリ - CSV入力版

学生アルバイト向けの扶養控除管理システムです。銀行明細のCSVファイルから収入データを自動取得し、扶養限度額内での労働をサポートします。

## 🎯 実装済み機能

### ✅ Core機能
1. **CSVアップロード機能**
   - 主要銀行（三菱UFJ、三井住友、みずほ、ゆうちょ）のCSV形式に対応
   - ドラッグ&ドロップによる直感的なファイルアップロード
   - CSV解析と収入データの自動抽出

2. **収入データ自動処理**
   - 銀行取引データから収入の自動判定
   - 重複チェックによる二重計上防止
   - バイト先の自動検出と管理

3. **扶養限度額計算エンジン**
   - 2025年制度対応（学生特定扶養控除150万円、基本扶養控除123万円）
   - リアルタイム使用率計算
   - 年間予測収入の算出

4. **ダッシュボードUI**
   - 扶養ステータスの視覚的表示
   - 収入履歴の一覧表示
   - プログレスバーによる限度額使用率表示

5. **スマートアラート機能**
   - 限度額接近時の警告
   - 月間目標収入の提案
   - 年間予測による超過リスク通知

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + **TypeScript**
- **Material-UI v5** (デザインシステム)
- **Vite** (ビルドツール)

### バックエンド
- **Node.js** + **Express** + **TypeScript**
- **Multer** (ファイルアップロード)
- **CSV-Parser** (CSVファイル解析)
- **Winston** (ログ管理)

### データベース
- **PostgreSQL** (Supabase)
- 拡張されたスキーマ設計
- Row Level Security (RLS) 対応

## 📂 プロジェクト構成

```
fuyou/
├── frontend/                 # React フロントエンド
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   │   ├── CSVUpload.tsx          # CSV アップロード
│   │   │   ├── FuyouStatusCard.tsx    # 扶養ステータス表示
│   │   │   ├── IncomeHistoryCard.tsx  # 収入履歴
│   │   │   ├── AlertsPanel.tsx        # アラート表示
│   │   │   └── Dashboard.tsx          # メインダッシュボード
│   │   ├── types/           # TypeScript 型定義
│   │   └── hooks/           # カスタムフック
├── backend/                  # Node.js バックエンド
│   ├── src/
│   │   ├── services/        # ビジネスロジック
│   │   │   ├── csvParserService.ts     # CSV解析
│   │   │   ├── csvIncomeService.ts     # 収入データ処理
│   │   │   └── enhancedCalculationService.ts # 扶養計算
│   │   ├── routes/          # API エンドポイント
│   │   │   └── csv.ts       # CSV関連API
│   │   └── utils/           # ユーティリティ
├── database/                 # データベーススキーマ
│   ├── enhanced_schema.sql
│   └── csv_processing_schema.sql
└── uploads/                  # 一時ファイル保存（自動削除）
```

## 🚀 主要API エンドポイント

### CSV処理
- `POST /api/csv/upload` - CSVファイルアップロード・処理
- `POST /api/csv/preview` - CSVプレビュー
- `GET /api/csv/history` - CSV処理履歴
- `GET /api/csv/stats` - CSV処理統計

### 扶養計算
- `GET /api/calculations/enhanced` - 拡張扶養計算
- `POST /api/calculations/recalculate` - 再計算実行

### 収入管理
- `GET /api/incomes/recent` - 最近の収入一覧
- `POST /api/incomes` - 手動収入追加

## 💡 特徴

### 1. 銀行CSVの自動解析
```typescript
// 主要銀行のCSV形式に対応
const BANK_FORMATS: Record<SupportedBank, BankCSVFormat> = {
  mufg: { dateColumn: '年月日', amountColumn: '入金額', ... },
  smbc: { dateColumn: '日付', amountColumn: '入金金額', ... },
  // ...
};
```

### 2. インテリジェントな収入判定
```typescript
// キーワードベースの収入判定
const INCOME_KEYWORDS = [
  'アルバイト', 'バイト', 'パート', '給与', '賃金',
  'コンビニ', 'ファミマ', 'セブン', 'マクドナルド',
  // ...
];
```

### 3. 2025年制度対応
```typescript
const FUYOU_LIMITS_2025 = {
  student_dependent: { amount: 1500000, name: '学生特定扶養控除' },
  basic_dependent: { amount: 1230000, name: '基本扶養控除' },
  social_insurance: { amount: 1300000, name: '社会保険扶養' },
};
```

## 📊 データベース設計

### 主要テーブル
1. **csv_uploads** - CSV処理履歴
2. **income_detection_rules** - 収入判定ルール
3. **csv_processing_errors** - 処理エラー詳細
4. **fuyou_calculations** - 扶養計算履歴
5. **smart_alerts** - スマートアラート

## 🔒 セキュリティ

- ファイルアップロード時の厳格な検証
- 処理後の一時ファイル自動削除
- Row Level Security による データアクセス制御
- CSRFトークンによるリクエスト保護

## 🎨 UI/UX 特徴

- **Material Design 3** に基づく直感的なUI
- **レスポンシブデザイン** (モバイル対応)
- **リアルタイム更新** によるライブダッシュボード
- **色分けされたアラート** (緑：安全、黄：警告、赤：危険)
- **ドラッグ&ドロップ** による簡単ファイルアップロード

## 📈 実装範囲

### ✅ 完了済み
- CSV入力による収入データ取得
- 扶養限度額の自動計算
- リアルタイムダッシュボード
- スマートアラート機能
- 銀行明細の自動解析

### 🔄 今後の拡張予定
- 手動収入入力フォーム
- バイト先詳細管理
- 労働時間最適化提案
- 年間収入レポート生成
- メール通知機能

## 🚦 開発・テスト

### フロントエンド開発サーバー
```bash
cd frontend
npm run dev
```

### バックエンド開発サーバー
```bash
cd backend
npm run dev
```

### ビルド
```bash
# フロントエンド
npm run build:frontend

# バックエンド
npm run build:backend
```

## 📝 使用方法

1. **ダッシュボードアクセス** - ログイン後、メインダッシュボードが表示
2. **CSVアップロード** - 「CSV登録」ボタンから銀行明細をアップロード
3. **扶養ステータス確認** - リアルタイムで扶養限度額の使用状況を確認
4. **アラート確認** - 重要な通知やリスク警告をチェック
5. **収入履歴確認** - 過去の収入データと統計を閲覧

## 🎯 対象ユーザー

- **学生アルバイター** - 扶養控除範囲内での労働管理
- **フリーター** - 基本扶養控除での収入管理
- **主婦/主夫** - 配偶者特別控除での労働調整

この CSV入力版により、銀行明細から自動的に収入データを取得し、扶養限度額の管理を効率化することができます。