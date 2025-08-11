import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tabs,
  Tab,
  Link,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  HelpOutline,
  Settings,
  Edit,
  ChevronLeft,
  ChevronRight,
  Notifications,
  Security,
  Palette,
  DataUsage,
  GetApp,
  CloudSync,
  Info,
  ContactSupport,
} from '@mui/icons-material';
import { InfiniteCalendar } from '../calendar/InfiniteCalendar';
import { useNavigate } from 'react-router-dom';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';

export const MobileSalaryView: React.FC = () => {
  const navigate = useNavigate();
  const { shifts, workplaces } = useSimpleShiftStore();
  const [tabValue, setTabValue] = useState<'month' | 'year'>('month');
  const [monthOffset, setMonthOffset] = useState(0);
  
  // 扶養状況の初回設定チェック（アプリ起動時に必ず表示）
  const [dependencySetupOpen, setDependencySetupOpen] = useState(() => {
    const saved = localStorage.getItem('dependencyStatus');
    return !saved; // 未設定なら自動で開く
  });
  
  // 扶養再設定用の状態
  const [dependencyRecheckOpen, setDependencyRecheckOpen] = useState(false);
  
  // 扶養質問のステップ管理
  const [currentStep, setCurrentStep] = useState(0);
  const [recheckCurrentStep, setRecheckCurrentStep] = useState(0);
  
  // 扶養状況の状態（詳細版）
  const [dependencyStatus, setDependencyStatus] = useState(() => {
    const saved = localStorage.getItem('dependencyStatus');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      // 基本情報
      isStudent: null, // null, true, false
      age: null, // null, 'under20', '20to22', 'over23'
      
      // 家族状況
      livingWithParents: null, // null, true, false
      hasSpouse: false, // 配偶者がいるか
      parentsDependency: null, // 'father', 'mother', 'both', 'none'
      
      // 働き方
      workHoursPerWeek: null, // 既存互換: 'under20' | '20to30' | 'over30'
      weeklyHours20: null, // boolean | null （106判定用）
      contractLength: null, // 'over2m' | 'under2m' | null
      officeSize51: 'unknown', // 'yes' | 'no' | 'unknown'
      studentException: 'none', // 'leave' | 'night' | 'graduate_soon' | 'none'
      employmentType: null, // 'parttime', 'arbeit', 'contract'
      
      // 目標設定
      priority: null, // 'maxIncome', 'keepDependency', 'balance'
      autoRecommend: true,
      selectedLimit: null, // 自動計算される
    };
  });

  // 月間目標（sessionStorage 永続化）
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    const raw = sessionStorage.getItem('monthlyTargetJPY');
    return raw ? parseInt(raw, 10) : 50000;
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(monthlyTarget));

  // 設定関連のstate
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const raw = localStorage.getItem('notifications');
    return raw ? JSON.parse(raw) : true;
  });
  const [theme, setTheme] = useState(() => {
    const raw = localStorage.getItem('theme');
    return raw || 'light';
  });
  const [dataSync, setDataSync] = useState(() => {
    const raw = localStorage.getItem('dataSync');
    return raw ? JSON.parse(raw) : true;
  });

  useEffect(() => {
    sessionStorage.setItem('monthlyTargetJPY', String(monthlyTarget));
  }, [monthlyTarget]);

  // 扶養状況の保存
  const saveDependencyStatus = (status: any) => {
    setDependencyStatus(status);
    localStorage.setItem('dependencyStatus', JSON.stringify(status));
    setDependencySetupOpen(false);
  };
  
  // 扶養限度額の自動計算
  const calculateDependencyLimit = () => {
    const s = dependencyStatus || {};

    // 手動設定が有効な場合は尊重
    if (s.autoRecommend === false && typeof s.selectedLimit === 'number') {
      return { limit: s.selectedLimit * 10000, type: `${s.selectedLimit}万円（手動）` };
    }

    // 2025年12月以降は123万円が基本
    const now = new Date();
    const is2025Plus = now.getFullYear() > 2025 || (now.getFullYear() === 2025 && now.getMonth() >= 11);
    
    let limit = is2025Plus ? 1_230_000 : 1_030_000;
    let type = is2025Plus ? '123万円（2025年税制）' : '103万円（現行）';

    // 106万円（社保）の可能性
    const weekly20 = s.weeklyHours20 === true || s.workHoursPerWeek === '20to30' || s.workHoursPerWeek === 'over30';
    const longContract = s.contractLength === 'over2m';
    const officeBig = s.officeSize51 === 'yes';
    if (weekly20 && longContract && officeBig) {
      limit = 1_060_000;
      type = '106万円（社会保険）';
    }

    // 130万円（健保の被扶養）目安／配偶者がいる場合の配偶者控除運用に合わせ推奨
    if (s.hasSpouse) {
      limit = 1_300_000;
      type = '130万円（配偶者/健保）';
    }

    // 150万円（学生特例）
    if (s.isStudent === true && (s.studentException === 'none' || !s.studentException) && s.priority === 'maxIncome') {
      limit = 1_500_000;
      type = '150万円（学生特例）';
    }

    // バランス志向/扶養優先
    if (s.priority === 'keepDependency' && s.parentsDependency && s.parentsDependency !== 'none') {
      limit = is2025Plus ? 1_230_000 : 1_030_000;
      type = is2025Plus ? '123万円（扶養優先）' : '103万円（扶養優先）';
    }

    return { limit, type };
  };
  
  const dependencyLimit = calculateDependencyLimit();
  
  // 今年の残り稼げる金額を計算
  const calculateRemainingAllowance = () => {
    const limit = dependencyLimit.limit;
    const remaining = limit - yearEarningsJPY;
    const monthsLeft = 12 - (new Date().getMonth() + 1);
    const monthlyAllowance = monthsLeft > 0 ? Math.floor(remaining / monthsLeft) : remaining;
    
    return {
      yearRemaining: Math.max(0, remaining),
      monthlyAllowance: Math.max(0, monthlyAllowance),
      isOverLimit: remaining < 0,
      percentageUsed: Math.min(100, Math.round((yearEarningsJPY / limit) * 100)),
    };
  };

  // 設定の永続化
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dataSync', JSON.stringify(dataSync));
  }, [dataSync]);

  // 集計
  const now = new Date();
  const shownDate = new Date(now);
  shownDate.setMonth(now.getMonth() + monthOffset);
  const ymKey = `${shownDate.getFullYear()}-${(shownDate.getMonth() + 1).toString().padStart(2, '0')}`;

  const {
    monthHoursMin,
    monthEstJPY,
    ytdMonthJPY,
    workplaceRows,
    yearHoursMin,
    yearEarningsJPY,
    months,
  } = useMemo(() => {
    let minutes = 0;
    let est = 0;
    let ytdMonth = 0;
    const perWorkplace: Record<
      string,
      { hoursMin: number; est: number; actual?: number }
    > = {};
    let yMinutes = 0;
    let yEarnings = 0;
    const monthAgg: Record<string, { earnings: number; minutes: number }> = {};

    shifts.forEach(s => {
      const d = new Date(s.date);
      const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const start = new Date(`2000-01-01T${s.startTime}`);
      const end = new Date(`2000-01-01T${s.endTime}`);
      const diffMin = Math.max(0, (end.getTime() - start.getTime()) / 60000);

      if (mKey === ymKey) {
        minutes += diffMin;
        est += s.totalEarnings;
        const row = (perWorkplace[s.workplaceName] ||= { hoursMin: 0, est: 0 });
        row.hoursMin += diffMin;
        row.est += s.totalEarnings;
      }
      // 当月までの合計（円形カードの「今日まで」想定）
      const isSameMonth =
        d.getFullYear() === shownDate.getFullYear() &&
        d.getMonth() === shownDate.getMonth();
      if (isSameMonth && d <= now) {
        ytdMonth += s.totalEarnings;
      }

      // 年集計
      if (d.getFullYear() === shownDate.getFullYear()) {
        yMinutes += diffMin;
        yEarnings += s.totalEarnings;
        const key = (d.getMonth() + 1).toString().padStart(2, '0');
        if (!monthAgg[key]) monthAgg[key] = { earnings: 0, minutes: 0 };
        monthAgg[key].earnings += s.totalEarnings;
        monthAgg[key].minutes += diffMin;
      }
    });

    const rows = Object.entries(perWorkplace).map(([name, v]) => ({
      name,
      hoursMin: v.hoursMin,
      est: v.est,
      actual: undefined as number | undefined,
    }));

    return {
      monthHoursMin: minutes,
      monthEstJPY: est,
      ytdMonthJPY: ytdMonth,
      workplaceRows: rows,
      yearHoursMin: yMinutes,
      yearEarningsJPY: yEarnings,
      months: monthAgg,
    };
  }, [shifts]);

  const remainingInfo = useMemo(() => calculateRemainingAllowance(), [yearEarningsJPY, dependencyLimit]);

  // 扶養状況ベースの表示内容計算
  const displayInfo = useMemo(() => {
    const monthlyDependencyLimit = Math.floor(dependencyLimit.limit / 12);
    const yearlyProgress = Math.min(100, Math.round((yearEarningsJPY / dependencyLimit.limit) * 100));
    
    return {
      monthlyDependencyLimit,
      yearlyProgress,
      monthlyProgressRatio: monthEstJPY / monthlyDependencyLimit,
      yearlyProgressRatio: yearEarningsJPY / dependencyLimit.limit
    };
  }, [dependencyLimit.limit, monthEstJPY, yearEarningsJPY]);

  const hours = Math.floor(monthHoursMin / 60);
  const mins = Math.floor(monthHoursMin % 60);

  // ステップ管理のヘルパー関数
  const getTotalSteps = () => {
    if (dependencyStatus.isStudent) {
      return 4; // 学生 -> 学生詳細 -> 働き方 -> 結果
    }
    return 3; // 学生でない -> 働き方 -> 結果
  };

  const getWorkStyleStep = () => {
    return dependencyStatus.isStudent ? 2 : 1;
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return dependencyStatus.isStudent !== null;
      case 1:
        return !dependencyStatus.isStudent || dependencyStatus.studentException !== null;
      default:
        return true;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* タブ 月/年 */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        centered
        sx={{ mb: 1 }}
      >
        <Tab value="month" label="月" />
        <Tab value="year" label="年" />
      </Tabs>

      {/* ヘッダー タイトル（タブ別） */}
      {tabValue === 'month' ? (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <Link
            component="button"
            underline="hover"
            onClick={() => setMonthOffset(o => o - 12)}
            sx={{ color: 'success.main', position: 'absolute', left: 0 }}
          >
            1年前を見る
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              aria-label="前月"
              onClick={() => setMonthOffset(o => o - 1)}
              size="small"
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {shownDate.getFullYear()}年{shownDate.getMonth() + 1}月
            </Typography>
            <IconButton
              aria-label="翌月"
              onClick={() => setMonthOffset(o => o + 1)}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </Box>

        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            gap: 1,
          }}
        >
          <IconButton
            aria-label="前年"
            onClick={() => setMonthOffset(o => o - 12)}
            size="small"
            sx={{ position: 'absolute', left: 0 }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {shownDate.getFullYear()}年
          </Typography>
          <IconButton
            aria-label="翌年"
            onClick={() => setMonthOffset(o => o + 12)}
            size="small"
            sx={{ position: 'absolute', right: 0 }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}

      {/* 月間目標と扶養設定 行 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            月間目標 ¥{monthlyTarget.toLocaleString()}
          </Typography>
          <IconButton
            aria-label="編集"
            size="small"
            onClick={() => {
              setEditValue(String(monthlyTarget));
              setEditOpen(true);
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
        
        <Button
          size="small"
          variant="outlined"
          onClick={() => setDependencySetupOpen(true)}
          sx={{ borderRadius: 999 }}
        >
          扶養: {dependencyLimit.type}
        </Button>
      </Box>


      {/* 円形カード：タブ別表示 */}
      {tabValue === 'month' ? (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'white',
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              今月の収入 / 月間扶養目安
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              ¥{monthEstJPY.toLocaleString()}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              / ¥{displayInfo.monthlyDependencyLimit.toLocaleString()}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1, 
                color: displayInfo.monthlyProgressRatio > 1 ? 'error.main' : 
                       displayInfo.monthlyProgressRatio > 0.8 ? 'warning.main' : 'success.main',
                fontWeight: 600 
              }}
            >
              月間使用率: {Math.round(displayInfo.monthlyProgressRatio * 100)}%
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'white',
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              今年の収入 / 扶養限度額
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ¥{yearEarningsJPY.toLocaleString()}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              / ¥{(dependencyLimit.limit / 10000).toFixed(0)}万円
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1, 
                color: displayInfo.yearlyProgressRatio > 1 ? 'error.main' :
                       displayInfo.yearlyProgressRatio > 0.9 ? 'warning.main' : 'success.main',
                fontWeight: 600 
              }}
            >
              年間使用率: {displayInfo.yearlyProgress}%
            </Typography>
          </Box>
        </Box>
      )}

      {/* サマリ行 */}
      {tabValue === 'month' ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: 1,
            mb: 2,
          }}
        >
          <Typography variant="body2">
            勤務時間{' '}
            <strong>
              {hours}h{mins}m
            </strong>
          </Typography>
          <Typography variant="body2">
            給料見込 <strong>¥{monthEstJPY.toLocaleString()}</strong>
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: 1,
            mb: 2,
          }}
        >
          <Typography variant="body2">
            勤務時間{' '}
            <strong>
              {Math.floor(yearHoursMin / 60)}h{Math.floor(yearHoursMin % 60)}m
            </strong>
          </Typography>
          <Typography variant="body2">
            収入合計 <strong>¥{yearEarningsJPY.toLocaleString()}</strong>
          </Typography>
        </Box>
      )}

      {/* 明細テーブル：タブ別 */}
      {tabValue === 'month' ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>勤務先</TableCell>
                  <TableCell align="right">勤務時間</TableCell>
                  <TableCell align="right">給料見込</TableCell>
                  <TableCell align="right">給料実績</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workplaceRows.map(r => (
                  <TableRow key={r.name}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="right">
                      {Math.floor(r.hoursMin / 60)}h
                      {Math.floor(r.hoursMin % 60)}
                    </TableCell>
                    <TableCell align="right">
                      ¥{r.est.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {r.actual == null ? (
                        <Chip label="未入力" size="small" />
                      ) : (
                        <>¥{r.actual.toLocaleString()}</>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>合計</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {hours}h{mins}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ¥{monthEstJPY.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    —
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>月</TableCell>
                  <TableCell align="right">勤務時間</TableCell>
                  <TableCell align="right">収入</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 12 }, (_, i) =>
                  (i + 1).toString().padStart(2, '0')
                ).map(m => (
                  <TableRow key={m}>
                    <TableCell>{parseInt(m, 10)}月</TableCell>
                    <TableCell align="right">
                      {Math.floor((months[m]?.minutes || 0) / 60)}h
                      {Math.floor((months[m]?.minutes || 0) % 60)}
                    </TableCell>
                    <TableCell align="right">
                      ¥{(months[m]?.earnings || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>合計</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {Math.floor(yearHoursMin / 60)}h
                    {Math.floor(yearHoursMin % 60)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ¥{yearEarningsJPY.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Button variant="outlined" fullWidth sx={{ mb: 2 }}>
        給与計算の内訳を見る
      </Button>

      {/* 扶養チェックボタン */}
      <Button 
        variant="contained" 
        color="primary"
        fullWidth 
        sx={{ mb: 2 }}
        onClick={() => setDependencyRecheckOpen(true)}
      >
        扶養をもう一度チェック
      </Button>

      <Box
        sx={{
          backgroundColor: 'grey.100',
          borderRadius: 1,
          p: 1.5,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          実際に支払われた給料と給与計算が異なるときは{' '}
          <Link component="button" underline="hover">
            使い方
          </Link>{' '}
          をご確認ください
        </Typography>
      </Box>

      {/* 月間目標 編集モーダル */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>月間目標を編集</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="金額 (円)"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={() => {
              const v = Math.max(0, parseInt(editValue || '0', 10));
              setMonthlyTarget(v);
              setEditOpen(false);
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 扶養状況設定ダイアログ */}
      <Dialog
        open={dependencySetupOpen}
        onClose={() => setDependencySetupOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            扶養状況の確認
          </Typography>
          <Typography variant="caption" color="text.secondary">
            あなたに最適な扶養限度額を設定します
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* ステップインジケーター */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {currentStep + 1} / {getTotalSteps()}
            </Typography>
          </Box>

          {/* ステップ 0: 学生かどうか */}
          {currentStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あなたは学生ですか？
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant={dependencyStatus.isStudent ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({...dependencyStatus, isStudent: true});
                    setTimeout(() => setCurrentStep(1), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  はい、学生です
                </Button>
                <Button
                  variant={dependencyStatus.isStudent === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({...dependencyStatus, isStudent: false});
                    setTimeout(() => setCurrentStep(getWorkStyleStep()), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  いいえ、学生ではありません
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 1: 学生の場合の追加質問 */}
          {currentStep === 1 && dependencyStatus.isStudent && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あてはまるものがあれば教えてください
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'none', label: '該当なし' },
                  { key: 'leave', label: '現在休学中' },
                  { key: 'night', label: '夜間・通信制の課程' },
                  { key: 'graduate_soon', label: '来年3月に卒業予定' }
                ].map(option => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    color={dependencyStatus.studentException === option.key ? 'primary' : 'default'}
                    variant={dependencyStatus.studentException === option.key ? 'filled' : 'outlined'}
                    onClick={() => {
                      setDependencyStatus({ ...dependencyStatus, studentException: option.key });
                      setTimeout(() => setCurrentStep(getWorkStyleStep()), 300);
                    }}
                    sx={{ cursor: 'pointer', m: 0.5 }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                学生でも働き方によって税の扱いが変わることがあります
              </Typography>
            </Box>
          )}

          {/* ステップ 2: 働き方について */}
          {currentStep === getWorkStyleStep() && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あてはまる働き方があれば教えてください
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
                わからなければ未選択でOKです
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  label="週20時間以上で働く予定"
                  color={dependencyStatus.weeklyHours20 ? 'primary' : 'default'}
                  variant={dependencyStatus.weeklyHours20 ? 'filled' : 'outlined'}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, weeklyHours20: !dependencyStatus.weeklyHours20 });
                  }}
                  sx={{ cursor: 'pointer', m: 0.5 }}
                />
                <Chip
                  label="同じ勤務先で2か月を超えて働く予定"
                  color={dependencyStatus.contractLength === 'over2m' ? 'primary' : 'default'}
                  variant={dependencyStatus.contractLength === 'over2m' ? 'filled' : 'outlined'}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, contractLength: dependencyStatus.contractLength === 'over2m' ? 'under2m' : 'over2m' });
                  }}
                  sx={{ cursor: 'pointer', m: 0.5 }}
                />
                <Chip
                  label="勤務先の従業員は51人以上"
                  color={dependencyStatus.officeSize51 === 'yes' ? 'primary' : 'default'}
                  variant={dependencyStatus.officeSize51 === 'yes' ? 'filled' : 'outlined'}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, officeSize51: dependencyStatus.officeSize51 === 'yes' ? 'no' : 'yes' });
                  }}
                  sx={{ cursor: 'pointer', m: 0.5 }}
                />
              </Box>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => setCurrentStep(getTotalSteps() - 1)}
                  sx={{ px: 4 }}
                >
                  次へ
                </Button>
              </Box>
            </Box>
          )}

          {/* 最終ステップ: 結果表示 */}
          {currentStep === getTotalSteps() - 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あなたの推奨設定
              </Typography>
              <Box sx={{ p: 3, bgcolor: 'primary.lighter', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                  年間 {Math.round(dependencyLimit.limit / 10000)}万円まで
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {dependencyLimit.type}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  月平均: 約{Math.floor(dependencyLimit.limit / 12).toLocaleString()}円
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dependencyStatus.autoRecommend}
                      onChange={(_, checked) => setDependencyStatus({ ...dependencyStatus, autoRecommend: checked })}
                    />
                  }
                  label={dependencyStatus.autoRecommend ? '自動推奨を使用' : '手動で金額を指定'}
                />
              </Box>

              {!dependencyStatus.autoRecommend && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>年間上限を選択</InputLabel>
                    <Select
                      value={dependencyStatus.selectedLimit}
                      onChange={(e) => setDependencyStatus({ ...dependencyStatus, selectedLimit: Number(e.target.value) })}
                      label="年間上限を選択"
                    >
                      <MenuItem value={103}>103万円</MenuItem>
                      <MenuItem value={123}>123万円</MenuItem>
                      <MenuItem value={106}>106万円</MenuItem>
                      <MenuItem value={130}>130万円</MenuItem>
                      {dependencyStatus.isStudent && (
                        <MenuItem value={150}>150万円</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {currentStep > 0 && (
            <Button 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            >
              前へ
            </Button>
          )}
          <Button onClick={() => setDependencySetupOpen(false)}>
            あとで
          </Button>
          {currentStep === getTotalSteps() - 1 && (
            <Button
              variant="contained"
              onClick={() => saveDependencyStatus(dependencyStatus)}
            >
              設定を保存
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 扶養再設定ダイアログ */}
      <Dialog
        open={dependencyRecheckOpen}
        onClose={() => setDependencyRecheckOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            扶養状況の再確認
          </Typography>
          <Typography variant="caption" color="text.secondary">
            現在の設定: {dependencyLimit.type}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* 簡易版: 質問をシンプルにまとめて表示 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              学生ですか？
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="はい"
                color={dependencyStatus.isStudent ? "primary" : "default"}
                variant={dependencyStatus.isStudent ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, isStudent: true})}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="いいえ"
                color={!dependencyStatus.isStudent ? "primary" : "default"}
                variant={!dependencyStatus.isStudent ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, isStudent: false})}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>

          {/* 学生の場合の追加質問（再設定時） */}
          {dependencyStatus.isStudent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                あてはまるものがあれば
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="該当なし"
                  size="small"
                  color={dependencyStatus.studentException === 'none' ? 'primary' : 'default'}
                  variant={dependencyStatus.studentException === 'none' ? 'filled' : 'outlined'}
                  onClick={() => setDependencyStatus({ ...dependencyStatus, studentException: 'none' })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="休学中"
                  size="small"
                  color={dependencyStatus.studentException === 'leave' ? 'primary' : 'default'}
                  variant={dependencyStatus.studentException === 'leave' ? 'filled' : 'outlined'}
                  onClick={() => setDependencyStatus({ ...dependencyStatus, studentException: 'leave' })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="夜間・通信制"
                  size="small"
                  color={dependencyStatus.studentException === 'night' ? 'primary' : 'default'}
                  variant={dependencyStatus.studentException === 'night' ? 'filled' : 'outlined'}
                  onClick={() => setDependencyStatus({ ...dependencyStatus, studentException: 'night' })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="卒業予定"
                  size="small"
                  color={dependencyStatus.studentException === 'graduate_soon' ? 'primary' : 'default'}
                  variant={dependencyStatus.studentException === 'graduate_soon' ? 'filled' : 'outlined'}
                  onClick={() => setDependencyStatus({ ...dependencyStatus, studentException: 'graduate_soon' })}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Box>
          )}

          <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              更新後の設定
            </Typography>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
              年間 {Math.round(dependencyLimit.limit / 10000)}万円まで
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {dependencyLimit.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              月平均: 約{Math.floor(dependencyLimit.limit / 12).toLocaleString()}円
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependencyRecheckOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={() => {
              saveDependencyStatus(dependencyStatus);
              setDependencyRecheckOpen(false);
            }}
          >
            設定を更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
