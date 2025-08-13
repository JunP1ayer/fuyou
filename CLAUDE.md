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
- **Vite 6.0.1** (最新版、開発・ビルド)
- **Zustand**: 状態管理（Immer + Persist）
- **PWA機能**: Service Worker対応、オフライン機能
- **多言語対応**: 6言語（日/英/独/仏/伊/西）
- **認証**: 複数システム対応（SimpleAuth + Supabase + Demo）

### バックエンド  
- **Node.js** + **Express** + **TypeScript**
- **Supabase** (PostgreSQL + 認証)
- **CSV処理**: Multer + CSV-Parser
- **OCR処理**: Google Cloud Vision API + Multer
- **バリデーション**: Zod
- **ロギング**: Winston構造化ログ

### 最適化サービス
- **Python 3.11+** + **FastAPI** + **uvicorn**
- **scipy.optimize**: 線形計画法
- **カスタム遺伝的アルゴリズム**: 複雑制約対応
- **Docker**: コンテナ化対応

### サーバーレス/AI
- **Vercel Functions**: エッジランタイム
- **OpenAI Vision API** / **Google Gemini API**
- **静的HTML版**: PWA対応のスタンドアロン版

## 🚀 主要開発コマンド

### 開発サーバー起動
```bash
# フロントエンド (http://localhost:4001)
cd frontend && npm run dev

# バックエンド (http://localhost:3001)  
cd backend && npm run dev

# Vercel サーバーレス版
vercel dev
```

### ビルド・品質チェック
```bash
# フロントエンド
cd frontend && npm run build
cd frontend && npm run typecheck
cd frontend && npm run lint

# バックエンド
cd backend && npm run build
cd backend && npm run lint

# サーバーレス版
npm run build
```

### テスト
```bash
# バックエンドテスト
cd backend && npm run test
cd backend && npm run test:watch

# データベース接続テスト
cd backend && npm run test:db
```

### 最適化サービス
```bash
# Python最適化サービス起動
cd optimization_service && python start_dev.py
# または
cd optimization_service && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Dockerでの起動
cd optimization_service && docker build -t fuyou-optimization . && docker run -p 8000:8000 fuyou-optimization
```

### サーバーレス版開発
```bash
# Vercel開発サーバー
vercel dev

# 本番デプロイ
vercel --prod
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
- **統合ストア**: Zustand + Immer + Persist（`unifiedStore.ts`）
- **カレンダー統合**: `useUnifiedCalendar` フックでシフト・カレンダーデータ統合
- **認証**: 複数認証システム（SimpleAuth + Supabase + Demo認証）
- **API通信**: 集約サービス (`apiService`) + TypeScript型定義
- **UI状態**: Zustand による集中管理 + useCallback パフォーマンス最適化

## 📂 重要なファイル構成

### プロジェクト全体構成
```
fuyou/
├── 📁 サーバーレス版（メイン）
│   ├── package.json                   # サーバーレス版設定
│   ├── vercel.json                    # Vercel デプロイ設定
│   └── api/                           # Vercel Functions
│       ├── openai-vision.js           # OpenAI Vision API統合
│       └── demo/login.js              # Demo認証API
├── 📁 React フロントエンド (frontend/)
│   ├── package.json                   # フロントエンド依存関係 (Vite 6.0)
│   └── src/
│       ├── store/unifiedStore.ts      # Zustand統合ストア
│       ├── hooks/useUnifiedCalendar.ts # カレンダー統合フック
│       └── components/calendar/       # 統合カレンダーUI
├── 📁 Node.js バックエンド (backend/)
├── 📁 Python最適化サービス (optimization_service/)
└── 📁 データベース (database/)
    ├── schema.sql                     # 基本スキーマ
    ├── enhanced_schema.sql            # 拡張機能
    └── optimization_schema.sql        # 最適化用テーブル
```

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
├── store/
│   ├── unifiedStore.ts             # Zustand統合ストア（メイン状態管理）
│   ├── calendarStore.ts            # カレンダー専用ストア
│   └── i18nStore.ts                # 国際化ストア
├── hooks/
│   ├── useUnifiedCalendar.ts       # 統合カレンダーフック
│   ├── useI18n.ts                  # 国際化フック
│   └── usePWA.ts                   # PWA機能フック
├── components/
│   ├── calendar/                   # 統合カレンダーUI (最新)
│   │   ├── CalendarApp.tsx         # メインカレンダーアプリ
│   │   ├── CalendarGrid.tsx        # グリッド表示
│   │   ├── MonthCalendar.tsx       # 月間カレンダー
│   │   └── NewBottomNavigation.tsx # タブナビゲーション
│   ├── auth/                       # 認証UI
│   │   ├── SimpleAuthForm.tsx      # シンプル認証フォーム
│   │   └── LanguageSelectionScreen.tsx # 言語選択
│   ├── salary/
│   │   └── MobileSalaryView.tsx    # 給与計算ビュー
│   ├── FriendSharingHub.tsx        # 友達共有機能
│   ├── GPT5ShiftSubmissionFlow.tsx # AI統合シフト登録
│   └── ShiftImageAnalyzer.tsx      # AI画像解析
├── utils/
│   └── shiftToCalendarConverter.ts # シフト⇔カレンダー変換
├── services/api.ts                 # API通信サービス（全エンドポイント対応）
├── contexts/                       # React Context
└── locales/                        # 多言語ファイル (6言語対応)
```

### Python最適化サービス構成
```
optimization_service/
├── main.py                            # FastAPI アプリケーション
├── algorithms/                        # 最適化アルゴリズム
│   ├── linear_programming.py         # 線形計画法 (Free Tier)
│   ├── genetic_algorithm.py          # 遺伝的アルゴリズム (Standard Tier)
│   ├── multi_objective.py            # 多目的最適化 NSGA-II (Pro Tier)
│   └── objective_functions.py        # 目的関数定義
├── services/                          # ビジネスロジック
│   ├── optimizer.py                   # 最適化エンジン
│   ├── constraint_manager.py         # 制約管理
│   └── solution_validator.py         # 解の検証
├── models/                            # Pydantic データモデル
├── utils/                             # ユーティリティ
├── requirements.txt                   # Python依存関係
└── Dockerfile                         # コンテナ定義
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

### ✅ 完了済み (Phase 1-4完成)
- CSV入力による収入データ取得・分析
- 2025年制度対応扶養計算エンジン
- デモ認証システム（UUID対応、WSL2最適化）
- Material-UI ダッシュボード（タブ式ナビゲーション）
- **統合シフト管理** (Zustand統合ストア、リアルタイム同期)
- **統合カレンダーシステム** (シフトデータ自動統合、月間・年間ビュー)
- **収入予測・分析機能** (年収予測、扶養限度額警告、リスク評価)
- **OCR機能** (Google Cloud Vision API統合、レート制限付き)
- **友達共有機能** (シェアコード、スケジュール共有)
- **多言語対応** (日本語・英語・ドイツ語など6言語)
- **PWA対応** (オフライン機能、プッシュ通知)
- **Vite 6.0対応開発環境** (最新版アップデート完了)
- **包括的API設計** (Shifts, Projections, Stats, OCR全対応)
- **AI統合** (GPT-5シフト分析、OpenAI Vision API統合)

### 📋 今後の計画  
- **Phase 5**: 最適化アルゴリズムの高度化（遺伝的アルゴリズム・多目的最適化）
- **Phase 6**: 銀行API連携・ML基盤制約学習
- **Phase 7**: ネイティブモバイルアプリ化・リアルタイム最適化

## 🎯 重要な開発原則

### 状態管理アーキテクチャ
- **Single Source of Truth**: `unifiedStore.ts`による集中状態管理
- **Optimistic Updates**: ローカル更新優先 + バックグラウンド同期
- **型安全性**: 全ストア・API・コンポーネントでTypeScript strict mode
- **パフォーマンス**: Zustand subscribeWithSelector による選択的再レンダリング

### API設計思想
- **Graceful Degradation**: オフライン時も基本機能継続
- **エラーハンドリング**: 全API呼び出しでtry-catch + ユーザーフィードバック
- **レート制限**: OCR機能等で適切な制限実装
- **バージョニング**: `/api/v1/`形式での将来対応

## 🛠️ WSL2開発環境対応

### Vite開発サーバー問題（解決済み）
- **現状**: Vite 6.0.1で安定動作確認済み
- **設定**: `--host 0.0.0.0 --port 4001`でWSL2内部アクセス対応
- **過去の対策**: バージョンアップにより回避策スクリプト不要に

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

## 🔧 アーキテクチャパターン

### 統合カレンダーアーキテクチャ
- **統合ストア**: Zustand + Immer + Persistによる単一状態管理
- **useUnifiedCalendar**: シフトデータとカレンダーイベントの自動統合
- **自動変換**: `shiftToCalendarConverter`でシフト↔カレンダーイベント変換
- **リアルタイム同期**: ローカル優先 + バックグラウンドAPI同期
- **オフライン対応**: localStorage永続化 + オンライン復帰時同期

### 多版本展開戦略
- **静的HTML版** (v5/v6): 軽量・高速・API設定不要
- **React版**: エンタープライズグレード・フル機能
- **サーバーレス版**: AI機能・Vercel Edge Functions

### 最適化サービス統合
- **FastAPI**: 非同期処理・高性能数学計算
- **階層アルゴリズム**: Linear Programming → Genetic → Multi-Objective
- **ティア制限**: Free/Standard/Pro による機能制限

### セキュリティレイヤード
- **フロントエンド**: CSP・XSS対策
- **API**: JWT・Rate Limiting・入力検証
- **データベース**: RLS・UUID・パラメータ化クエリ
- **ファイル処理**: MIME検証・サイズ制限・ウイルススキャン準備