# 扶養管理アプリ (Fuyou Management App) - LOVABLEプロンプト

## プロジェクト概要

学生アルバイト向けの扶養控除管理システムを作成してください。2025年の扶養制度変更に対応し、収入管理とシフト最適化を通じて扶養限度額内での最大収入を実現するWebアプリケーションです。

## 主要機能要件

### 1. シフト管理機能
- **カレンダー表示**: 月間ビューでシフトを視覚的に管理
- **シフトCRUD操作**: 作成・読取・更新・削除
- **複数職場対応**: 色分けによる視覚的区別
- **自動計算**: 労働時間と給与の自動計算
- **給料日設定**: 職場ごとの給料日管理

### 2. 収入予測・分析機能
- **年収予測**: 現在のペースから年収を予測
- **扶養限度額警告**: 103万円、130万円、150万円の各限度額に対する警告
- **リスクレベル評価**: safe（緑）、warning（黄）、danger（赤）の3段階
- **推奨日額目標**: 扶養内に収めるための1日あたりの推奨収入額
- **月別・職場別統計**: 詳細な収入分析

### 3. CSV入力機能
- **銀行明細CSV対応**: 自動的に収入データを取得
- **複数形式対応**: 主要銀行のCSV形式に対応
- **データマッピング**: 列の自動認識とマッピング

### 4. OCR機能（画像からシフト抽出）
- **画像アップロード**: シフト表の写真をアップロード
- **AI自動解析**: Google Cloud Vision APIでテキスト抽出
- **シフト情報抽出**: 日付、時間、職場を自動認識
- **編集可能UI**: 認識結果の手動修正機能
- **一括登録**: 確認後にシフトデータを一括登録

## 技術要件

### フロントエンド
```typescript
// 技術スタック
- React 18 + TypeScript (strict mode)
- Material-UI v5 (全UIコンポーネントで使用)
- Vite (開発・ビルド)
- date-fns (日付処理)
- PWA対応 (Service Worker)

// ディレクトリ構造
frontend/src/
├── components/
│   ├── shifts/           # シフト管理コンポーネント
│   ├── Dashboard.tsx     # メインダッシュボード
│   ├── CSVUpload.tsx     # CSV入力
│   └── OCRProcessor.tsx  # OCR処理
├── services/api.ts       # API通信サービス
├── contexts/AuthContext.tsx  # 認証管理
└── types/               # TypeScript型定義
```

### バックエンド
```typescript
// 技術スタック
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + 認証)
- Zod (バリデーション)
- Multer (ファイルアップロード)
- Google Cloud Vision API (OCR)

// API設計
POST   /api/auth/demo-login     # デモログイン
GET    /api/shifts              # シフト一覧取得
POST   /api/shifts              # シフト作成
PUT    /api/shifts/:id          # シフト更新
DELETE /api/shifts/:id          # シフト削除
GET    /api/shifts/stats        # 統計情報取得
GET    /api/shifts/projections  # 収入予測取得
POST   /api/csv/upload          # CSV処理
POST   /api/ocr/upload          # OCR処理
```

### データベース設計
```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- シフトテーブル
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  workplace_id UUID REFERENCES workplaces(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) GENERATED ALWAYS AS (
    hourly_rate * (
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 - 
      break_minutes / 60.0
    )
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 職場テーブル
CREATE TABLE workplaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  payday INTEGER CHECK (payday BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を全テーブルで有効化
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
```

## UI/UX設計要件

### デザインシステム
- **Material Design 3準拠**: 最新のMaterial-UIコンポーネント使用
- **レスポンシブデザイン**: モバイルファースト
- **色彩設計**:
  - Primary: #1976d2 (青)
  - Success: #4caf50 (緑) - 安全な収入レベル
  - Warning: #ff9800 (黄) - 警告レベル
  - Error: #f44336 (赤) - 危険レベル

### 主要画面
1. **ダッシュボード**: 扶養ステータス、月間収入、アラート表示
2. **シフトカレンダー**: 月間カレンダーでシフトを視覚的に管理
3. **シフト登録ダイアログ**: 日付・時間・職場を選択して登録
4. **収入予測カード**: 年収予測と推奨日額目標を表示
5. **OCR処理画面**: 画像アップロード→AI処理→結果編集→一括登録

## セキュリティ要件

1. **認証システム**
   - JWT Bearer Token使用
   - デモ認証（開発用）とSupabase認証（本番用）の両対応
   - トークンの有効期限管理

2. **データ保護**
   - Row Level Security (RLS) による行レベルセキュリティ
   - UUID主キーによる推測困難なID
   - HTTPS通信の強制

3. **入力検証**
   - Zodスキーマによるリクエスト/レスポンス検証
   - SQLインジェクション対策
   - XSS対策（React自動エスケープ + CSP）

4. **ファイルアップロード**
   - 5MB制限
   - 画像ファイルのみ許可（MIME型チェック）
   - ウイルススキャン準備

## 実装の優先順位

### Phase 1: 基本機能（必須）
1. ユーザー認証（デモ認証）
2. シフトCRUD操作
3. カレンダー表示
4. 基本的な収入計算

### Phase 2: 分析機能（重要）
1. 年収予測
2. 扶養限度額警告
3. 月別統計
4. 職場別分析

### Phase 3: 高度な機能（推奨）
1. CSV入力
2. OCR機能
3. 最適化提案
4. PWA対応

## 特別な実装注意点

1. **2025年扶養制度対応**
   - 103万円の壁（所得税）
   - 130万円の壁（社会保険）
   - 150万円の壁（配偶者特別控除）

2. **日本の労働法対応**
   - 休憩時間の自動計算
   - 深夜手当（22:00-5:00）
   - 休日手当

3. **使いやすさの追求**
   - ワンクリックでシフト登録
   - ドラッグ&ドロップでシフト移動
   - スワイプで月間移動

4. **パフォーマンス最適化**
   - React.memo使用
   - useCallback/useMemoの適切な使用
   - 仮想スクロール（大量データ時）

## サンプルコード

### シフト登録コンポーネント例
```typescript
interface ShiftFormData {
  date: Date;
  workplaceId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const ShiftFormDialog: React.FC = () => {
  const [formData, setFormData] = useState<ShiftFormData>({
    date: new Date(),
    workplaceId: '',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 60
  });

  const handleSubmit = async () => {
    try {
      const response = await apiService.createShift({
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd')
      });
      
      if (response.success) {
        showSuccessToast('シフトを登録しました');
        onClose();
      }
    } catch (error) {
      showErrorToast('登録に失敗しました');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>シフト登録</DialogTitle>
      <DialogContent>
        <DatePicker
          label="日付"
          value={formData.date}
          onChange={(date) => setFormData({...formData, date})}
        />
        {/* 他のフォームフィールド */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained">
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## 期待される成果物

1. **フルスタックWebアプリケーション**
   - React フロントエンド
   - Express バックエンドAPI
   - PostgreSQL データベース（Supabase）

2. **ドキュメント**
   - API仕様書
   - データベース設計書
   - 使用方法ガイド

3. **デプロイ準備**
   - Docker設定（オプション）
   - 環境変数テンプレート
   - CI/CD設定（オプション）

## 追加の考慮事項

- **多言語対応準備**: i18n構造（将来的な英語対応）
- **アナリティクス**: 使用状況の追跡（プライバシー配慮）
- **バックアップ**: データエクスポート機能
- **通知機能**: 扶養限度額接近時のアラート

このアプリケーションは、学生アルバイターが扶養控除を意識しながら効率的に働けるようサポートし、税制上の不利益を避けながら最大限の収入を得られるよう設計されています。