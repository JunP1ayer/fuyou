-- 4時間休憩設定追加マイグレーション
-- 既存の休憩時間設定に4時間超の設定を追加

-- 1. shiftsテーブルに4時間休憩設定を追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS auto_break_4_hours BOOLEAN DEFAULT true;

-- 2. workplacesテーブル（もしあれば）に4時間休憩設定を追加
-- 職場ごとの休憩設定用
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workplaces') THEN
        -- 4時間休憩設定フィールドを追加
        ALTER TABLE workplaces 
        ADD COLUMN IF NOT EXISTS break_auto_4h_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS break_4h_minutes INTEGER DEFAULT 15;
        
        -- 既存の6時間、8時間設定も追加（まだない場合）
        ALTER TABLE workplaces
        ADD COLUMN IF NOT EXISTS break_auto_6h_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS break_6h_minutes INTEGER DEFAULT 45,
        ADD COLUMN IF NOT EXISTS break_auto_8h_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS break_8h_minutes INTEGER DEFAULT 60;
    END IF;
END $$;

-- 3. コメント追加
COMMENT ON COLUMN shifts.auto_break_4_hours IS '4時間越えで15分自動休憩';

-- 4. 4時間休憩を含む休憩時間計算関数の更新
CREATE OR REPLACE FUNCTION calculate_total_break_minutes(
    p_total_hours DECIMAL,
    p_manual_break_minutes INTEGER,
    p_auto_break_4h BOOLEAN DEFAULT true,
    p_auto_break_6h BOOLEAN DEFAULT true,
    p_auto_break_8h BOOLEAN DEFAULT true,
    p_break_4h_minutes INTEGER DEFAULT 15,
    p_break_6h_minutes INTEGER DEFAULT 45,
    p_break_8h_minutes INTEGER DEFAULT 60
) RETURNS INTEGER AS $$
DECLARE
    total_break_minutes INTEGER;
BEGIN
    -- 手動休憩時間からスタート
    total_break_minutes := COALESCE(p_manual_break_minutes, 0);
    
    -- 自動休憩時間を追加（階層的適用：長時間が短時間を上書き）
    IF p_auto_break_8h AND p_total_hours > 8 THEN
        total_break_minutes := total_break_minutes + p_break_8h_minutes;
    ELSIF p_auto_break_6h AND p_total_hours > 6 THEN
        total_break_minutes := total_break_minutes + p_break_6h_minutes;
    ELSIF p_auto_break_4h AND p_total_hours > 4 THEN
        total_break_minutes := total_break_minutes + p_break_4h_minutes;
    END IF;
    
    RETURN total_break_minutes;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 5. 4時間休憩を含む収入計算関数の更新
CREATE OR REPLACE FUNCTION calculate_shift_earnings(
    p_start_time TIME,
    p_end_time TIME,
    p_hourly_rate DECIMAL,
    p_manual_break_minutes INTEGER DEFAULT 0,
    p_auto_break_4h BOOLEAN DEFAULT true,
    p_auto_break_6h BOOLEAN DEFAULT true,
    p_auto_break_8h BOOLEAN DEFAULT true,
    p_overtime_enabled BOOLEAN DEFAULT true
) RETURNS TABLE (
    total_hours DECIMAL,
    break_minutes INTEGER,
    working_hours DECIMAL,
    base_earnings DECIMAL,
    overtime_earnings DECIMAL,
    total_earnings DECIMAL
) AS $$
DECLARE
    calculated_total_hours DECIMAL;
    calculated_break_minutes INTEGER;
    calculated_working_hours DECIMAL;
    base_hours DECIMAL;
    overtime_hours DECIMAL;
    calculated_base_earnings DECIMAL;
    calculated_overtime_earnings DECIMAL;
BEGIN
    -- 総勤務時間を計算（日跨ぎ考慮）
    IF p_end_time < p_start_time THEN
        calculated_total_hours := EXTRACT(EPOCH FROM (p_end_time + INTERVAL '1 day' - p_start_time)) / 3600;
    ELSE
        calculated_total_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
    END IF;
    
    -- 総休憩時間を計算
    calculated_break_minutes := calculate_total_break_minutes(
        calculated_total_hours,
        p_manual_break_minutes,
        p_auto_break_4h,
        p_auto_break_6h,
        p_auto_break_8h
    );
    
    -- 実働時間を計算
    calculated_working_hours := GREATEST(0, calculated_total_hours - (calculated_break_minutes::DECIMAL / 60));
    
    -- 基本時間と残業時間を分離
    IF p_overtime_enabled AND calculated_working_hours > 8 THEN
        base_hours := 8;
        overtime_hours := calculated_working_hours - 8;
    ELSE
        base_hours := calculated_working_hours;
        overtime_hours := 0;
    END IF;
    
    -- 収入を計算
    calculated_base_earnings := base_hours * p_hourly_rate;
    calculated_overtime_earnings := overtime_hours * p_hourly_rate * 1.25; -- 25%割増
    
    -- 結果を返却
    total_hours := calculated_total_hours;
    break_minutes := calculated_break_minutes;
    working_hours := calculated_working_hours;
    base_earnings := calculated_base_earnings;
    overtime_earnings := calculated_overtime_earnings;
    total_earnings := calculated_base_earnings + calculated_overtime_earnings;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 6. 既存データの4時間休憩設定を有効化
UPDATE shifts SET auto_break_4_hours = true WHERE auto_break_4_hours IS NULL;

-- 7. 使用例とテストクエリ
/*
-- 使用例1: 5時間勤務の休憩時間計算
SELECT calculate_total_break_minutes(5, 30, true, true, true);
-- 結果: 45分 (手動30分 + 4時間超15分)

-- 使用例2: 収入計算関数のテスト
SELECT * FROM calculate_shift_earnings('09:00', '18:00', 1000, 30, true, true, true, true);
-- 結果: 9時間勤務、手動30分 + 8時間超60分休憩 = 実働7.5時間

-- 使用例3: 既存シフトデータの一括更新
UPDATE shifts 
SET 
    working_hours = calc.working_hours,
    calculated_earnings = calc.total_earnings,
    updated_at = NOW()
FROM (
    SELECT 
        s.id,
        calc_result.working_hours,
        calc_result.total_earnings
    FROM shifts s
    CROSS JOIN LATERAL calculate_shift_earnings(
        s.start_time, 
        s.end_time, 
        s.hourly_rate, 
        s.break_minutes,
        s.auto_break_4_hours,
        s.auto_break_6_hours, 
        s.auto_break_8_hours,
        true
    ) as calc_result
) as calc
WHERE shifts.id = calc.id;
*/