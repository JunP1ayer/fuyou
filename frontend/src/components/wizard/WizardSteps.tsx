import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { evaluateRules, type WizardAnswers } from '../../lib/fuyou/rules';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import { formatCurrency } from '../../utils/calculations';

export const WizardSteps: React.FC = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<WizardAnswers>({
    officeSize51: 'unknown',
  });
  const { shifts } = useSimpleShiftStore();
  const [useAuto, setUseAuto] = useState<boolean>(shifts.length > 0);
  const [weekDays, setWeekDays] = useState<number>(3);
  const [avgHoursPerDay, setAvgHoursPerDay] = useState<number>(5);
  const [hourlyRate, setHourlyRate] = useState<string>('');

  // YTD（今年分の登録シフトから）
  const now = new Date();
  const currentYear = now.getFullYear();
  const ytd = shifts
    .filter(s => new Date(s.date).getFullYear() === currentYear)
    .reduce((sum, s) => sum + (s.totalEarnings || 0), 0);
  const remainingMonths = 12 - (now.getMonth() + 1);
  // 直近28日から自動推定
  const since = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const minutes28 = shifts
    .filter(s => new Date(s.date) >= since && new Date(s.date) <= now)
    .reduce((sum, s) => {
      const start = new Date(`2000-01-01T${s.startTime}`);
      const end = new Date(`2000-01-01T${s.endTime}`);
      return sum + Math.max(0, (end.getTime() - start.getTime()) / 60000);
    }, 0);
  const weeklyAuto = minutes28 / 60 / 4; // 時間/週
  const weeklyManual = weekDays * avgHoursPerDay;
  const weeklyHours = useAuto ? weeklyAuto : weeklyManual;
  const monthly = weeklyHours * 4.33;
  const rate = Math.max(0, parseInt(hourlyRate || '0', 10));
  const future = monthly * rate * remainingMonths;
  const projected = Math.floor(ytd + future);

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 160px)' },
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 560 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            かんたんチェック（収入がわからない方向け）
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            週ごとのバラつきがあってもOK。直近のシフトから自動推定、または「週の勤務日数
            × 1日の平均時間」でざっくり入力できます。
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={useAuto}
                  onChange={(_, v) => setUseAuto(v)}
                />
              }
              label={`直近のシフトから自動見積もり（約${weeklyAuto.toFixed(1)}時間/週）`}
            />
            {!useAuto && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="wd">週の勤務日数</InputLabel>
                  <Select
                    labelId="wd"
                    label="週の勤務日数"
                    value={weekDays}
                    onChange={e => setWeekDays(Number(e.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <MenuItem key={n} value={n}>
                        {n} 日/週
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="hd">1日の平均時間</InputLabel>
                  <Select
                    labelId="hd"
                    label="1日の平均時間"
                    value={avgHoursPerDay}
                    onChange={e => setAvgHoursPerDay(Number(e.target.value))}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <MenuItem key={n} value={n}>
                        {n} 時間/日
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            <TextField
              type="number"
              inputMode="numeric"
              label="平均時給 (円)"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              sx={{ maxWidth: 280 }}
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            今年の登録済み見込み: {formatCurrency(ytd)} / 残り
            {remainingMonths}か月を入力ペースで見積り
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            今年の見込み収入（自動計算）: {Number.isFinite(projected) ? formatCurrency(projected) : '—'}
          </Typography>

          <Button
            variant="contained"
            size="large"
            disabled={!(weeklyHours > 0 && rate > 0)}
            onClick={() => {
              const result = evaluateRules({
                ...answers,
                incomeJPY: projected,
              });
              // 月間総労働時間から週20hの目安を推計（4.33週換算）
              const estWeeklyHours = weeklyHours;
              navigate('/wizard/result', {
                state: {
                  result,
                  answers: {
                    ...answers,
                    incomeJPY: projected,
                    weeklyHours20: estWeeklyHours >= 20,
                  },
                },
              });
            }}
          >
            結果を見る
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
