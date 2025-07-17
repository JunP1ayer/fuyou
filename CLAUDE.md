# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 プロジェクト概要

**扶養管理アプリ (Fuyou Management App)**
学生アルバイト向けの扶養控除管理システム。2つの主要機能：
1. **CSV入力版** - 銀行明細CSVから収入データを自動取得・分析
2. **シフト管理機能** - 手動シフト登録と収入予測（Phase 1実装中）

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + **TypeScript** + **Material-UI v5**
- **Vite** (開発・ビルド)
- **認証**: Supabase Auth + Demo認証システム

### バックエンド  
- **Node.js** + **Express** + **TypeScript**
- **Supabase** (PostgreSQL + 認証)
- **CSV処理**: Multer + CSV-Parser
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
│   ├── demo.ts              # デモ認証
│   └── calculations.ts      # 扶養計算
├── services/                 # ビジネスロジック
│   ├── shiftService.ts      # シフト CRUD操作
│   ├── csvParserService.ts  # CSV解析
│   └── enhancedCalculationService.ts  # 2025年制度対応計算
├── middleware/
│   ├── validation.ts        # バリデーション + 認証
│   └── errorHandler.ts      # エラーハンドリング
└── types/api.ts             # API型定義 (Zod スキーマ)
```

### フロントエンド主要ファイル
```
frontend/src/
├── components/
│   ├── shifts/              # シフト管理UI (Phase 1)
│   │   └── ShiftCalendar.tsx
│   ├── CSVUpload.tsx        # CSV アップロード
│   ├── Dashboard.tsx        # メインダッシュボード
│   └── FuyouStatusCard.tsx  # 扶養ステータス表示
├── types/
│   ├── shift.ts             # シフト関連型定義
│   └── fuyou.ts             # 扶養管理型定義
├── services/api.ts          # API通信サービス
└── contexts/AuthContext.tsx # 認証管理
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

### ✅ 完了済み
- CSV入力による収入データ取得・分析
- 2025年制度対応扶養計算エンジン
- デモ認証システム
- Material-UI ダッシュボード

### 🔄 Phase 1 実装中
- シフト管理機能 (手動シフト登録)
- シフトカレンダー表示
- 収入予測との連携

### 📋 今後の計画  
- **Phase 2**: OCR シフト表自動解析
- **Phase 3**: 銀行API連携

## 🚦 開発時の注意点

### 品質保証
- **pre-commit hooks**: Prettier, ESLint, TypeScript チェック
- **Git commits**: Conventional Commits 形式
- **型チェック**: 必ず `npm run typecheck:frontend` 実行

### セキュリティ
- 機密情報 (.env, API keys) はコミット禁止
- ファイルアップロード時の厳格な検証
- RLS ポリシーでデータアクセス制御

### パフォーマンス
- React: useCallback/useMemo でレンダリング最適化
- API: 必要最小限のデータ取得
- 大量データ処理: ページネーション実装

## 🎨 UI/UX 設計原則

- **レスポンシブデザイン**: モバイルファースト
- **アクセシビリティ**: ARIA属性、キーボード操作対応
- **ユーザーフィードバック**: ローディング、エラー状態の明確な表示
- **色彩設計**: 緑(安全)、黄(警告)、赤(危険) の直感的な色分け