-- 休憩時間設定フィールド追加マイグレーション
-- shiftsテーブルに自動休憩設定を追加

-- 1. 新しいフィールドを追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS auto_break_6_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_break_8_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS overtime_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS day_of_week_settings_enabled BOOLEAN DEFAULT false;

-- 2. 既存のbreak_minutesフィールドにコメント追加（手動休憩時間）
COMMENT ON COLUMN shifts.break_minutes IS '手動入力された休憩時間（分）';
COMMENT ON COLUMN shifts.auto_break_6_hours IS '6時間越えで45分自動休憩';
COMMENT ON COLUMN shifts.auto_break_8_hours IS '8時間越えで60分自動休憩';
COMMENT ON COLUMN shifts.overtime_enabled IS '残業割増25%適用（8時間超）';
COMMENT ON COLUMN shifts.day_of_week_settings_enabled IS '曜日別詳細設定の有効化';

-- 3. 既存データの整合性チェック用関数
CREATE OR REPLACE FUNCTION check_shift_break_time_consistency()
RETURNS TABLE (
    shift_id UUID,
    job_source_name TEXT,
    date DATE,
    total_hours DECIMAL,
    break_minutes INTEGER,
    auto_break_6_hours BOOLEAN,
    auto_break_8_hours BOOLEAN,
    calculated_working_hours DECIMAL,
    stored_working_hours DECIMAL,
    needs_update BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as shift_id,
        s.job_source_name,
        s.date,
        EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 as total_hours,
        s.break_minutes,
        s.auto_break_6_hours,
        s.auto_break_8_hours,
        CASE 
            WHEN s.auto_break_8_hours AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 > 8 THEN
                (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - ((s.break_minutes + 60.0) / 60.0)
            WHEN s.auto_break_6_hours AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 > 6 THEN
                (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - ((s.break_minutes + 45.0) / 60.0)
            ELSE
                (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - (s.break_minutes / 60.0)
        END as calculated_working_hours,
        s.working_hours as stored_working_hours,
        ABS(
            CASE 
                WHEN s.auto_break_8_hours AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 > 8 THEN
                    (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - ((s.break_minutes + 60.0) / 60.0)
                WHEN s.auto_break_6_hours AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 > 6 THEN
                    (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - ((s.break_minutes + 45.0) / 60.0)
                ELSE
                    (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) - (s.break_minutes / 60.0)
            END - s.working_hours
        ) > 0.01 as needs_update
    FROM shifts s
    ORDER BY s.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 実働時間と収入を再計算する関数
CREATE OR REPLACE FUNCTION recalculate_shift_earnings()
RETURNS INTEGER AS $$
DECLARE
    shift_record RECORD;
    total_hours DECIMAL;
    total_break_minutes INTEGER;
    actual_working_hours DECIMAL;
    new_earnings DECIMAL;
    updated_count INTEGER := 0;
BEGIN
    FOR shift_record IN 
        SELECT id, start_time, end_time, break_minutes, auto_break_6_hours, auto_break_8_hours, hourly_rate
        FROM shifts 
    LOOP
        -- 総勤務時間を計算
        total_hours := EXTRACT(EPOCH FROM (shift_record.end_time - shift_record.start_time)) / 3600;
        
        -- 総休憩時間を計算
        total_break_minutes := shift_record.break_minutes;
        
        -- 自動休憩時間を追加
        IF shift_record.auto_break_8_hours AND total_hours > 8 THEN
            total_break_minutes := total_break_minutes + 60;
        ELSIF shift_record.auto_break_6_hours AND total_hours > 6 THEN
            total_break_minutes := total_break_minutes + 45;
        END IF;
        
        -- 実働時間を計算
        actual_working_hours := GREATEST(0, total_hours - (total_break_minutes::DECIMAL / 60));
        
        -- 収入を計算
        new_earnings := actual_working_hours * shift_record.hourly_rate;
        
        -- データベースを更新
        UPDATE shifts 
        SET 
            working_hours = actual_working_hours,
            calculated_earnings = new_earnings,
            updated_at = NOW()
        WHERE id = shift_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用例とコメント:
-- 1. 整合性チェック: SELECT * FROM check_shift_break_time_consistency() WHERE needs_update = true;
-- 2. 一括再計算: SELECT recalculate_shift_earnings();