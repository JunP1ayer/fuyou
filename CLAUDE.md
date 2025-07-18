# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 プロジェクト概要

**扶養管理アプリ (Fuyou Management App)**
学生アルバイト向けの扶養控除管理システム。主要機能：
1. **CSV入力版** - 銀行明細CSVから収入データを自動取得・分析
2. **シフト管理機能** - 手動シフト登録と収入予測（Phase 1完成）
3. **OCR機能** - シフト表画像からの自動データ抽出（Phase 2完成）

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + **TypeScript** + **Material-UI v5**
- **Vite** (開発・ビルド)
- **認証**: Supabase Auth + Demo認証システム

### バックエンド  
- **Node.js** + **Express** + **TypeScript**
- **Supabase** (PostgreSQL + 認証)
- **CSV処理**: Multer + CSV-Parser
- **OCR処理**: Google Cloud Vision API + Multer
- **バリデーション**: Zod

## 🚀 主要開発コマンド

### 開発サーバー起動
```bash
# フロントエンド (http://localhost:3000)
npm run dev:frontend

# バックエンド (http://localhost:3001)  
npm run dev:backend
```

### ビルド・品質チェック
```bash
# フロントエンド
npm run build:frontend
npm run typecheck:frontend
npm run lint:frontend

# バックエンド
npm run build:backend
cd backend && npm run lint
```

### テスト
```bash
# バックエンドテスト
cd backend && npm run test
cd backend && npm run test:watch

# データベース接続テスト
cd backend && npm run test:db
```

## 🏗️ アーキテクチャ概要

### 認証システム
- **Demo認証**: 開発用、Base64エンコードされたJWTトークン
- **Supabase認証**: 本番用、Row Level Security (RLS) 対応
- **ミドルウェア**: `requireAuthOrDemo` でデモ/本番両対応

### API設計パターン
- **ルート**: `/api/{feature}` (例: `/api/shifts`, `/api/csv`)
- **レスポンス**: `{ success: boolean, data?: any, error?: any }`
- **バリデーション**: Zod スキーマ + `validateSchema` ミドルウェア
- **エラーハンドリング**: `asyncHandler` + `createError`

### フロントエンド状態管理
- **認証**: React Context (`AuthContext`) + Custom Hook (`useAuth`)
- **API通信**: 集約サービス (`apiService`) + TypeScript型定義
- **UI状態**: ローカルstate + useCallback パフォーマンス最適化

## 📂 重要なファイル構成

### バックエンド主要ファイル
```
backend/src/
├── app.ts                    # Express アプリケーション設定
├── routes/                   # API エンドポイント
│   ├── shifts.ts            # シフト管理 (Phase 1)
│   ├── csv.ts               # CSV処理
│   ├── ocr.ts               # OCR処理 (Phase 2)
│   ├── demo.ts              # デモ認証
│   └── calculations.ts      # 扶養計算
├── services/                 # ビジネスロジック
│   ├── shiftService.ts      # シフト CRUD操作
│   ├── csvParserService.ts  # CSV解析
│   ├── ocrService.ts        # OCR処理 (Google Vision API)
│   └── enhancedCalculationService.ts  # 2025年制度対応計算
├── middleware/
│   ├── validation.ts        # バリデーション + 認証
│   ├── uploadMiddleware.ts  # ファイルアップロード処理
│   └── errorHandler.ts      # エラーハンドリング
└── types/
    ├── api.ts               # API型定義 (Zod スキーマ)
    └── ocr.ts               # OCR専用型定義
```

### フロントエンド主要ファイル
```
frontend/src/
├── components/
│   ├── shifts/                      # シフト管理UI (Phase 1完成)
│   │   ├── ShiftCalendar.tsx       # メインカレンダー表示
│   │   ├── ShiftFormDialog.tsx     # シフト新規登録
│   │   ├── ShiftEditDialog.tsx     # シフト編集
│   │   └── EarningsProjectionCard.tsx # 収入予測表示
│   ├── CSVUpload.tsx               # CSV アップロード
│   ├── Dashboard.tsx               # メインダッシュボード
│   ├── FuyouStatusCard.tsx         # 扶養ステータス表示
│   ├── AlertsPanel.tsx             # アラート表示
│   ├── IncomeHistoryCard.tsx       # 収入履歴表示
│   ├── OCRUpload.tsx               # OCR画像アップロード (Phase 3完成)
│   ├── OCRProcessor.tsx            # OCR処理UI (Phase 3完成)
│   ├── OCRResultEditor.tsx         # OCR結果編集 (Phase 3完成)
│   └── OCRShiftManager.tsx         # OCR統合管理 (Phase 3完成)
├── types/
│   ├── shift.ts                    # シフト関連型定義
│   ├── fuyou.ts                    # 扶養管理型定義
│   └── ocr.ts                      # OCR型定義 (Phase 3完成)
├── services/api.ts                 # API通信サービス（全エンドポイント対応）
├── contexts/AuthContext.tsx        # 認証管理
└── utils/                          # ユーティリティ関数
```

## 💾 データベース設計

### 主要テーブル
- **shifts** - シフト情報 (Phase 1で新規作成)
- **incomes** - 収入データ
- **csv_uploads** - CSV処理履歴  
- **fuyou_calculations** - 扶養計算履歴

### 重要な設計原則
- **RLS有効**: 全テーブルで Row Level Security
- **UUID主キー**: セキュリティ向上
- **タイムスタンプ**: created_at/updated_at 自動更新
- **型安全**: TypeScript型とSupabase型の整合性

## 🔧 開発ルール

### TypeScript
- **strict mode**: any型禁止、型安全性重視
- **import順序**: 外部ライブラリ → 相対パス → 型定義
- **命名規則**: PascalCase (コンポーネント) / camelCase (関数・変数)

### Material-UI使用方針
- **必須使用**: 全UIコンポーネントでMUI v5を使用
- **テーマ**: Material Design 3準拠
- **アイコン**: @mui/icons-material 使用

### API設計
- **RESTful**: 一貫したエンドポイント設計
- **認証**: Bearer Token (Demo/Supabase両対応)
- **バリデーション**: Zod スキーマでリクエスト/レスポンス検証

## 🎯 現在の実装状況

### ✅ 完了済み (Phase 1-3完成)
- CSV入力による収入データ取得・分析
- 2025年制度対応扶養計算エンジン
- デモ認証システム（UUID対応、WSL2最適化）
- Material-UI ダッシュボード（タブ式ナビゲーション）
- **シフト管理機能** (手動シフト登録・編集・削除)
- **シフトカレンダー表示** (月間ビュー、日別詳細表示)
- **収入予測機能** (年収予測、扶養限度額警告、リスク評価)
- **OCR機能** (Google Cloud Vision API統合、レート制限付き)
- **WSL2開発環境** (Vite 7.x対応、複数回避策実装)
- **包括的API設計** (Shifts, Projections, Stats, OCR全対応)
- **フロントエンドOCR UI** (画像アップロード、処理UI、結果編集、シフト統合)

### 📋 今後の計画  
- **Phase 4**: 銀行API連携
- **Phase 5**: 最適化アルゴリズム（労働時間最適化提案）
- **Phase 6**: モバイルアプリ化

## 🛠️ WSL2開発環境対応

### Vite開発サーバー問題
- **問題**: Vite 7.0.4がWSL2で正常にバインドされない
- **対策**: 複数の回避策スクリプトを実装
  - `workaround-dev.cjs` - プロキシ経由でのサーバー起動
  - `fix-vite-wsl.cjs` - Express プロキシサーバー
  - `downgrade-vite.cjs` - Vite 5.xへのダウングレード

### npm権限問題
- **問題**: WSL2でnpm installに管理者権限が必要
- **対策**: 既存workaroundスクリプトの活用
- **推奨**: PowerShell管理者権限での実行

### API接続設定
- **WSL2 IP**: `172.26.93.180:3001` (動的IP対応)
- **認証**: UUID形式のデモトークン
- **テスト**: `demo.html` での接続確認

## 🚦 開発時の注意点

### 品質保証
- **pre-commit hooks**: Prettier, ESLint, TypeScript チェック
- **Git commits**: Conventional Commits 形式
- **型チェック**: 必ず `npm run typecheck:frontend` 実行

### セキュリティ
- **機密情報**: .env, API keys はコミット禁止
- **Google Cloud認証**: `backend/config/google-vision-key.json` は .gitignore で除外済み
- **ファイルアップロード**: 厳格な検証（5MB制限、MIME型チェック）
- **RLS**: 全テーブルで Row Level Security 適用

### OCR機能の注意点
- **レート制限**: 15分10回、1時間20回の制限実装済み
- **コスト管理**: Google Cloud予算アラート設定必須
- **認証キー**: 環境変数 `GOOGLE_APPLICATION_CREDENTIALS` で管理

### パフォーマンス
- React: useCallback/useMemo でレンダリング最適化
- API: 必要最小限のデータ取得
- 大量データ処理: ページネーション実装

## 🎨 UI/UX 設計原則

- **レスポンシブデザイン**: モバイルファースト
- **アクセシビリティ**: ARIA属性、キーボード操作対応
- **ユーザーフィードバック**: ローディング、エラー状態の明確な表示
- **色彩設計**: 緑(安全)、黄(警告)、赤(危険) の直感的な色分け