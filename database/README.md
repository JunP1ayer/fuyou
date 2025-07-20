# データベーススキーマ

## 主要スキーマファイル

- `schema.sql` - 基本テーブル定義
- `enhanced_schema.sql` - 2025年制度対応の拡張スキーマ
- `csv_processing_schema.sql` - CSV処理用スキーマ
- `optimization_schema.sql` - 最適化機能用スキーマ

## 使用方法

```bash
# Supabaseでスキーマを適用
psql -h your-db-host -U postgres -d your-db-name -f schema.sql
```