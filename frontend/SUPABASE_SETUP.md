# Supabase セットアップガイド

## 📝 Supabaseプロジェクトの作成

1. **Supabaseアカウント作成**
   - https://supabase.com/ にアクセス
   - 「Start your project」をクリック
   - GitHubアカウントでサインアップ（推奨）

2. **新規プロジェクト作成**
   - 「New project」をクリック
   - プロジェクト名: `fuyou-app`（任意）
   - データベースパスワード: 強力なパスワードを設定（保存しておく）
   - リージョン: `Northeast Asia (Tokyo)` を選択
   - 「Create new project」をクリック

3. **認証情報の取得**
   - プロジェクトが作成されたら、左メニューの「Settings」→「API」を選択
   - 以下の情報をコピー:
     - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
     - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔧 環境変数の設定

`frontend/.env` ファイルを編集:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 データベーステーブルの作成

1. **SQL Editorを開く**
   - 左メニューの「SQL Editor」をクリック
   - 「New query」をクリック

2. **以下のSQLを実行**

```sql
-- ユーザープロファイルテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- シフトテーブル
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  workplace_id UUID,
  workplace_name TEXT,
  hourly_wage INTEGER DEFAULT 1000,
  break_duration INTEGER DEFAULT 0,
  earnings INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 収入テーブル
CREATE TABLE incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own shifts" ON shifts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shifts" ON shifts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incomes" ON incomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes" ON incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. **「Run」をクリックしてSQLを実行**

## ✅ 動作確認

1. http://localhost:4005 にアクセス
2. 「新規登録」からアカウントを作成
3. メールアドレスとパスワードでログイン
4. アプリが正常に動作することを確認

## 🔐 認証設定（オプション）

Supabaseダッシュボードの「Authentication」→「Providers」から:
- Email認証の設定
- Google/GitHub OAuth（必要に応じて）
- メール確認の無効化（開発環境の場合）

## 🚨 トラブルシューティング

### 「Failed to fetch」エラーが出る場合
- Supabase URLとANON KEYが正しく設定されているか確認
- ネットワーク接続を確認
- Supabaseプロジェクトが起動しているか確認

### ログインできない場合
- Supabaseダッシュボードで「Authentication」→「Users」を確認
- メールアドレスが正しく登録されているか確認
- パスワードをリセットしてみる