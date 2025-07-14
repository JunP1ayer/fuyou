# 扶養管理アプリ (Fuyou Management App)

## 概要
学生アルバイト向けの自動扶養管理サービス。銀行口座連携により収入を自動追跡し、扶養控除の範囲内での労働をサポートします。

## 技術スタック
- **フロントエンド**: React + TypeScript + Material-UI
- **バックエンド**: Python + FastAPI
- **データベース**: PostgreSQL
- **銀行連携**: Moneytree LINK API (予定)

## プロジェクト構成
```
fuyou-app/
├── frontend/          # React フロントエンド
├── backend/           # FastAPI バックエンド
├── database/          # データベーススキーマ・マイグレーション
├── docs/              # ドキュメント
└── docker-compose.yml # 開発環境
```

## 開発開始日
2025-07-14