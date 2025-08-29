# Repository Guidelines

## プロジェクト構成
- `frontend/`: React + Vite (TypeScript)。テストは `src/test/**`、公開資産は `public/`。
- `backend/`: Node.js + Express (TypeScript)。ソースは `src/`、ビルドは `dist/`。テストは `src/test/**`。
- `api/`: Vercel 互換のサーバーレス関数（例: `health.js`, `openai-vision.js`）。
- `optimization_service/`: Python 製の最適化エンジン（algorithms/services/utils）。
- `database/`: SQL スキーマと移行。適用は `apply_schema.md` を参照。
- 設定: ルートおよび各サービスに `.env.example` あり。複製して `.env` を作成。

## 初回セットアップ
- 前提: Node.js 18+（必須）、Python 3.10+（`optimization_service/` 利用時）。
- 依存関係: それぞれで実行 — `npm i`、`cd frontend && npm i`、`cd backend && npm i`。
- 環境変数: `.env.example` を `.env` にコピー（ルート/`frontend`/`backend`）。必須例:
  - ルート: `OPENAI_API_KEY`, `GEMINI_API_KEY`。
  - frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`。
  - backend: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`。
- ポート/URL: Frontend 4009, Backend 3001。
  - backend の `.env`: `CORS_ORIGIN=http://localhost:4009`, `FRONTEND_URL=http://localhost:4009`。
- DB: 必要に応じて `database/apply_schema.md` を参照し Supabase へ適用。

## ビルド・テスト・開発コマンド
- ルート（Vercel 開発）: `npm run dev` — サーバーレスをローカル実行。
- フロントエンド:
  - `cd frontend && npm run dev` — Vite を `http://localhost:4009` で起動。
  - `npm run build` — 型チェック後、`dist/` に本番ビルド。
  - `npm run test` / `npm run test:watch` — Vitest 実行。
- バックエンド:
  - `cd backend && npm run dev` — nodemon で TS ソースを起動。
  - `npm run build && npm start` — 変換後に Express を実行。
  - `npm run test` — Jest 実行。
- デプロイ（Vercel）: ルートで `npm run deploy`。

## コーディング規約・命名
- ESLint + Prettier を使用（2 スペース、シングルクォート、セミコロン、幅 80）。
- React コンポーネント: `PascalCase`（例: `CalendarView.tsx`）。
- フック/ユーティリティ: `camelCase`（例: `useShiftStore.ts`, `formatCurrency.ts`）。
- ディレクトリ/非コンポーネント: `kebab-case`。

## テスト方針
- フロント: Vitest + jsdom。`frontend/src/test/**` に `*.test.tsx|ts`。
- バックエンド: Jest。`backend/src/test/**` に `*.test.ts`。
- 認証、日付計算、CSV/PDF 解析など主要ケースと境界値を重視。新機能にはテストを追加。

## コミット/PR ガイドライン
- コミット: 慣用プレフィックス + 要約。絵文字は任意（履歴に準拠）。
  - 例: `feat: 🎯 add shift optimizer`, `fix: 🔧 handle Google login error`。
- PR: 目的・範囲・確認手順を明記。課題をリンク（例: `Closes #123`）。UI 変更はスクショ/GIF、環境変数や移行の変更は `.env.example` と `database/` を更新。

## セキュリティ・設定
- 秘密情報はコミットしない。`.env` を利用し、`.env.example` を常に最新化。
- 認証や AI 関連のエンドポイント変更時は、`backend/src/` と `api/` のレート制限・入力検証を見直す。
