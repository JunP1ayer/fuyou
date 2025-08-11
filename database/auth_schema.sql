-- 🔐 認証用データベーススキーマ
-- Supabase SQL Editor で実行してください

-- プロフィールテーブル作成
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS) 有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールアクセスポリシー（ユーザーは自分のプロフィールのみ操作可能）
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- プロフィール自動作成トリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時にプロフィール自動作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 更新日時自動更新関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- プロフィール更新時に updated_at を自動更新
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 既存のincomes, shifts等のテーブルにuser_idを追加（すでにある場合はスキップ）
DO $$ 
BEGIN
    -- incomesテーブルにuser_idを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incomes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.incomes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own incomes" ON public.incomes
            USING (auth.uid() = user_id);
    END IF;

    -- shiftsテーブルにuser_idを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shifts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.shifts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own shifts" ON public.shifts
            USING (auth.uid() = user_id);
    END IF;
END $$;