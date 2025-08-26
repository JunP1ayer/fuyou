-- 🔍 既存ユーザー検出用SQL関数
-- Supabase SQL Editor で実行してください

-- 1. メールアドレスで既存ユーザーを検出する関数
CREATE OR REPLACE FUNCTION public.check_existing_user_by_email(
    p_email TEXT
)
RETURNS TABLE (
    user_exists BOOLEAN,
    user_id UUID,
    email TEXT,
    name TEXT,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    sign_in_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as user_exists,
        au.id as user_id,
        au.email::TEXT,
        COALESCE(p.name, au.email) as name,
        au.last_sign_in_at,
        COALESCE(au.raw_app_meta_data->>'sign_in_count', '0')::INTEGER as sign_in_count
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE au.email = p_email
      AND au.email_confirmed_at IS NOT NULL
      AND au.deleted_at IS NULL;
    
    -- ユーザーが見つからない場合
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            FALSE as user_exists,
            NULL::UUID as user_id,
            NULL::TEXT as email,
            NULL::TEXT as name,
            NULL::TIMESTAMP WITH TIME ZONE as last_sign_in_at,
            0 as sign_in_count;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ユーザーの最終ログイン情報を取得する関数
CREATE OR REPLACE FUNCTION public.get_user_login_history(
    p_user_id UUID
)
RETURNS TABLE (
    total_sign_ins INTEGER,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    days_since_last_login INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(au.raw_app_meta_data->>'sign_in_count', '0')::INTEGER as total_sign_ins,
        au.last_sign_in_at,
        au.created_at,
        CASE 
            WHEN au.last_sign_in_at IS NOT NULL THEN
                EXTRACT(DAY FROM (NOW() - au.last_sign_in_at))::INTEGER
            ELSE
                EXTRACT(DAY FROM (NOW() - au.created_at))::INTEGER
        END as days_since_last_login
    FROM auth.users au
    WHERE au.id = p_user_id
      AND au.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. メールアドレスの使用状況をチェックする関数
CREATE OR REPLACE FUNCTION public.get_email_usage_status(
    p_email TEXT
)
RETURNS TABLE (
    is_registered BOOLEAN,
    is_confirmed BOOLEAN,
    has_profile BOOLEAN,
    has_data BOOLEAN,
    registration_date TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID;
    v_has_incomes BOOLEAN := FALSE;
    v_has_shifts BOOLEAN := FALSE;
BEGIN
    -- ユーザー基本情報を取得
    SELECT au.id, au.created_at, au.last_sign_in_at
    INTO v_user_id, registration_date, last_activity
    FROM auth.users au
    WHERE au.email = p_email AND au.deleted_at IS NULL;
    
    IF v_user_id IS NULL THEN
        -- ユーザーが存在しない場合
        RETURN QUERY
        SELECT 
            FALSE as is_registered,
            FALSE as is_confirmed,
            FALSE as has_profile,
            FALSE as has_data,
            NULL::TIMESTAMP WITH TIME ZONE as registration_date,
            NULL::TIMESTAMP WITH TIME ZONE as last_activity;
        RETURN;
    END IF;
    
    -- データの存在確認
    SELECT EXISTS(SELECT 1 FROM public.incomes WHERE user_id = v_user_id) INTO v_has_incomes;
    SELECT EXISTS(SELECT 1 FROM public.shifts WHERE user_id = v_user_id) INTO v_has_shifts;
    
    RETURN QUERY
    SELECT 
        TRUE as is_registered,
        EXISTS(
            SELECT 1 FROM auth.users 
            WHERE id = v_user_id AND email_confirmed_at IS NOT NULL
        ) as is_confirmed,
        EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE id = v_user_id
        ) as has_profile,
        (v_has_incomes OR v_has_shifts) as has_data,
        registration_date,
        last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重複サインアップを防ぐためのチェック関数
CREATE OR REPLACE FUNCTION public.prevent_duplicate_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_count INTEGER;
BEGIN
    -- 同じメールアドレスで確認済みのユーザーが既に存在するかチェック
    SELECT COUNT(*) INTO v_existing_count
    FROM auth.users
    WHERE email = NEW.email 
      AND email_confirmed_at IS NOT NULL 
      AND deleted_at IS NULL
      AND id != NEW.id;
    
    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'このメールアドレスは既に登録済みです。ログインをお試しください。'
        USING HINT = 'existing_user_detected';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ユーザー統計取得関数
CREATE OR REPLACE FUNCTION public.get_user_statistics(
    p_user_id UUID
)
RETURNS TABLE (
    total_incomes INTEGER,
    total_shifts INTEGER,
    total_amount DECIMAL(12,2),
    first_income_date DATE,
    last_activity_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.incomes WHERE user_id = p_user_id) as total_incomes,
        (SELECT COUNT(*)::INTEGER FROM public.shifts WHERE user_id = p_user_id) as total_shifts,
        COALESCE((SELECT SUM(amount) FROM public.incomes WHERE user_id = p_user_id), 0) as total_amount,
        (SELECT MIN(income_date) FROM public.incomes WHERE user_id = p_user_id) as first_income_date,
        GREATEST(
            COALESCE((SELECT MAX(income_date) FROM public.incomes WHERE user_id = p_user_id), '1900-01-01'::DATE),
            COALESCE((SELECT MAX(shift_date) FROM public.shifts WHERE user_id = p_user_id), '1900-01-01'::DATE)
        ) as last_activity_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 関数の実行権限を適切に設定
GRANT EXECUTE ON FUNCTION public.check_existing_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_login_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_usage_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics(UUID) TO authenticated;

-- 7. 使用例のコメント
/*
-- 使用例:

-- 既存ユーザーチェック
SELECT * FROM public.check_existing_user_by_email('user@example.com');

-- ユーザーログイン履歴
SELECT * FROM public.get_user_login_history('user-uuid-here');

-- メール使用状況
SELECT * FROM public.get_email_usage_status('user@example.com');

-- ユーザー統計
SELECT * FROM public.get_user_statistics('user-uuid-here');
*/