# 扶養プロ (Fuyou Pro) - 学生アルバイト向け扶養管理アプリ

<!-- NOTE: 下記の OWNER/REPO をご自身の GitHub リポジトリに置き換えてください -->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

## 📱 概要
学生アルバイト向けの扶養控除管理システム。収入管理、シフト管理、AI-OCR機能を統合し、2025年の新扶養控除制度（123万円）にも対応。

## 🚀 現在提供中のバージョン

### 1. **扶養プロ v6.0** - シフトボード風UX版
- **ファイル**: `fuyou-interactive-v6.html`
- **特徴**: シフト管理に特化したモバイルファーストUI
- **機能**: カレンダー日付タップで即編集、収入予測、扶養限度額管理

### 2. **扶養プロ v5.0** - AI搭載サーバーレス版  
- **ファイル**: `fuyou-serverless-v5.html`
- **特徴**: API設定不要でAI-OCR機能を利用可能
- **機能**: シフト表画像のAI解析、自動データ抽出、Vercel Functions対応

### 3. **React管理システム** - エンタープライズ版
- **ディレクトリ**: `frontend/` + `backend/`
- **特徴**: TypeScript、Material-UI、Supabase統合
- **機能**: CSV入力、OCR、シフト管理、最適化エンジン

## 🛠️ 技術スタック

### フロントエンド
- React 18 + TypeScript + Material-UI v5
- Vite (開発ビルドツール)
- PWA対応 (Service Worker)

### バックエンド
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + 認証)
- Google Cloud Vision API (OCR)
- Python最適化サービス (optimization_service/)

### AI/サーバーレス
- Vercel Functions
- OpenAI Vision API / Google Gemini API
- エッジランタイム対応

## 📂 プロジェクト構成
```
fuyou/
├── index.html                    # ランディングページ
├── fuyou-interactive-v6.html     # シフトボード風UX版
├── fuyou-serverless-v5.html      # AI搭載サーバーレス版
├── api/                          # Vercel Functions
│   ├── openai-vision.js
│   └── gemini-vision.js
├── frontend/                     # React フロントエンド
├── backend/                      # Express APIサーバー
├── database/                     # スキーマ定義
├── optimization_service/         # Python最適化エンジン
└── vercel.json                   # Vercelデプロイ設定
```

## 🚀 クイックスタート

### HTMLバージョン（v5/v6）
```bash
# ローカルで実行
python -m http.server 8000
# または
npx serve .
```

### Reactバージョン
```bash
# フロントエンド
cd frontend && npm install && npm run dev

# バックエンド
cd backend && npm install && npm run dev
```

### Vercelデプロイ
```bash
vercel --prod
```

## 📅 開発履歴
- 2025-07-14: プロジェクト開始
- 2025-07-16: CSV版完成 (Phase 1)
- 2025-07-18: シフト管理機能追加 (Phase 2)
- 2025-07-20: OCR機能統合 (Phase 3)
- 2025-07-21: シフトボード風UX実装 (v6.0)
