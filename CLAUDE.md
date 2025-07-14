# CLAUDE.md - プロジェクト設定ファイル

## 📋 プロジェクト概要

**扶養管理アプリ (Fuyou Management App)**
学生アルバイト向けの自動扶養管理サービス。銀行口座連携により収入を自動追跡し、扶養控除の範囲内での労働をサポートします。

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript + Material-UI v5
- **バックエンド**: Python + FastAPI
- **データベース**: PostgreSQL
- **銀行連携**: Moneytree LINK API (予定)
- **デプロイ**: Vercel (frontend) + Railway (backend)

## 🚀 主要コマンド

### 開発サーバー起動

```bash
# フロントエンド開発サーバー
npm run dev:frontend

# バックエンド開発サーバー (今後実装)
npm run dev:backend
```

### ビルド・テスト

```bash
# フロントエンドビルド
npm run build:frontend

# リント・フォーマット
npm run lint:frontend
npm run format:frontend

# 型チェック
npm run typecheck:frontend
```

### コード品質チェック

```bash
# 全体的な品質チェック (hooks.mjs)
node .claude/hooks.mjs
```

## 📁 プロジェクト構成

```
fuyou-app/
├── frontend/           # React フロントエンド
│   ├── src/
│   │   ├── components/ # UIコンポーネント (MUI使用)
│   │   ├── pages/      # ページコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   ├── utils/      # ユーティリティ関数
│   │   └── types/      # TypeScript型定義
│   └── package.json
├── backend/            # FastAPI バックエンド (今後実装)
├── database/           # データベーススキーマ・マイグレーション
├── .claude/           # Claude Code設定
│   ├── hooks.mjs      # 品質チェックスクリプト
│   └── commands/      # カスタムコマンド
├── .husky/            # Git hooks
└── .github/           # GitHub Actions CI/CD
```

## 🔧 開発ルール

### コーディング規約

- **UI**: 必ずMaterial-UI v5のコンポーネントを使用
- **型安全性**: TypeScriptを活用し、any型は禁止
- **命名規則**: コンポーネントはPascalCase、関数はcamelCase
- **ファイル構成**: 機能別にディレクトリを分割

### Git運用

- **ブランチ**: `feature/機能名` または `fix/バグ名`
- **コミット**: [Conventional Commits](https://www.conventionalcommits.org/) 形式
- **プルリクエスト**: 必須、レビュー後マージ

### 品質保証

- **pre-commit**: Prettier, ESLint, TypeScript, 機密ファイルチェック
- **CI/CD**: GitHub Actions による自動テスト・ビルド
- **型チェック**: `npm run typecheck:frontend` 必須

## 🎯 MVP目標機能

1. ユーザー認証 (メール・パスワード)
2. 銀行口座連携
3. 収入自動識別・分類
4. 扶養限度額計算エンジン
5. ダッシュボード (進捗可視化)
6. アラート機能 (上限接近通知)

## 🔒 セキュリティ

- 機密情報 (.env, API keys) のコミット禁止
- OAuth認証によるBank API接続
- 個人情報の適切な暗号化・保護

## 📈 開発マイルストーン

- **Phase 1**: MVP基本機能 (1-2ヶ月)
- **Phase 2**: UI/UX改善・テスト強化
- **Phase 3**: 本格運用・スケール対応

## 🌐 今後の展開

- 海外展開 (アメリカ学生ローン管理)
- B2B版 (企業向け扶養管理)
- AI予測機能 (収入最適化提案)
