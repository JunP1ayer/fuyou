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
  
  // 扶養状況の初回設定チェック
  const [dependencySetupOpen, setDependencySetupOpen] = useState(() => {
    const saved = localStorage.getItem('dependencyStatus');
    return !saved; // 未設定なら自動で開く
  });
  
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
      workHoursPerWeek: null, // null, 'under20', '20to30', 'over30'
      employmentType: null, // 'parttime', 'arbeit', 'contract'
      
      // 目標設定
      priority: null, // 'maxIncome', 'keepDependency', 'balance'
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
    const status = dependencyStatus;
    
    // 質問が完了していない場合はデフォルト
    if (!status.isStudent || !status.priority) {
      return { limit: 1030000, type: '103万円（基本）' };
    }
    
    // 学生で勤労学生控除を活用する場合
    if (status.isStudent && status.age !== 'over23' && status.priority === 'maxIncome') {
      return { limit: 1500000, type: '150万円（勤労学生控除）' };
    }
    
    // 配偶者がいる場合
    if (status.hasSpouse) {
      return { limit: 1300000, type: '130万円（配偶者控除）' };
    }
    
    // 週20時間以上働く場合
    if (status.workHoursPerWeek === '20to30' || status.workHoursPerWeek === 'over30') {
      if (status.priority === 'keepDependency') {
        return { limit: 1060000, type: '106万円（社会保険の壁）' };
      }
    }
    
    // 親の扶養を維持したい場合
    if (status.priority === 'keepDependency' && status.parentsDependency !== 'none') {
      return { limit: 1030000, type: '103万円（所得税の壁）' };
    }
    
    // バランス重視
    if (status.priority === 'balance') {
      return { limit: 1030000, type: '103万円（バランス重視）' };
    }
    
    return { limit: 1030000, type: '103万円（基本）' };
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

  const hours = Math.floor(monthHoursMin / 60);
  const mins = Math.floor(monthHoursMin % 60);

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

      {/* 扶養状況カード - 残り稼げる金額を強調 */}
      <Card sx={{ mb: 2, p: 2, bgcolor: remainingInfo.isOverLimit ? 'error.lighter' : 'success.lighter' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          扶養限度額まで
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            color: remainingInfo.isOverLimit ? 'error.main' : 'success.main',
            mb: 1 
          }}
        >
          {remainingInfo.isOverLimit ? '超過！' : `あと ¥${remainingInfo.yearRemaining.toLocaleString()}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              今月の目安
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ¥{remainingInfo.monthlyAllowance.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              使用率
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {remainingInfo.percentageUsed}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${remainingInfo.percentageUsed}%`,
              height: 8,
              bgcolor: remainingInfo.percentageUsed > 90 ? 'error.main' : 
                       remainingInfo.percentageUsed > 70 ? 'warning.main' : 'success.main',
              transition: 'width 0.3s ease'
            }}
          />
        </Box>
      </Card>

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
              今月の給料
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              ¥{monthEstJPY.toLocaleString()}
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
              今年の収入
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ¥{yearEarningsJPY.toLocaleString()}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1, 
                color: yearEarningsJPY > dependencyLimit.limit ? 'error.main' : 'success.main',
                fontWeight: 600 
              }}
            >
              扶養限度: ¥{(dependencyLimit.limit / 10000).toFixed(0)}万
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              1. あなたは学生ですか？
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="はい（学生です）"
                color={dependencyStatus.isStudent ? "primary" : "default"}
                variant={dependencyStatus.isStudent ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, isStudent: true})}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="いいえ（学生ではありません）"
                color={!dependencyStatus.isStudent ? "primary" : "default"}
                variant={!dependencyStatus.isStudent ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, isStudent: false})}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              2. 目標とする扶養限度額は？
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={dependencyStatus.selectedLimit}
                onChange={(e) => setDependencyStatus({...dependencyStatus, selectedLimit: Number(e.target.value)})}
              >
                <MenuItem value={103}>103万円 - 所得税の壁（基本）</MenuItem>
                <MenuItem value={106}>106万円 - 社会保険加入の壁</MenuItem>
                <MenuItem value={130}>130万円 - 配偶者の扶養から外れる壁</MenuItem>
                {dependencyStatus.isStudent && (
                  <MenuItem value={150}>150万円 - 学生特例（勤労学生控除）</MenuItem>
                )}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {dependencyStatus.selectedLimit === 103 && "基本的な扶養控除の限度額です"}
              {dependencyStatus.selectedLimit === 106 && "週20時間以上働く場合の社会保険加入基準"}
              {dependencyStatus.selectedLimit === 130 && "配偶者の社会保険の扶養から外れる基準"}
              {dependencyStatus.selectedLimit === 150 && "学生の場合、勤労学生控除で150万円まで非課税"}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              3. 親の収入レベルは？（任意）
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="〜400万円"
                size="small"
                color={dependencyStatus.parentIncome === 'low' ? "primary" : "default"}
                variant={dependencyStatus.parentIncome === 'low' ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, parentIncome: 'low'})}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="400〜800万円"
                size="small"
                color={dependencyStatus.parentIncome === 'middle' ? "primary" : "default"}
                variant={dependencyStatus.parentIncome === 'middle' ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, parentIncome: 'middle'})}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="800万円〜"
                size="small"
                color={dependencyStatus.parentIncome === 'high' ? "primary" : "default"}
                variant={dependencyStatus.parentIncome === 'high' ? "filled" : "outlined"}
                onClick={() => setDependencyStatus({...dependencyStatus, parentIncome: 'high'})}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              親の収入により扶養控除の影響が変わります
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              あなたの推奨設定
            </Typography>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
              年間 {dependencyStatus.selectedLimit}万円まで
            </Typography>
            <Typography variant="caption" color="text.secondary">
              月平均: 約{Math.floor(dependencyStatus.selectedLimit * 10000 / 12).toLocaleString()}円
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependencySetupOpen(false)}>
            あとで
          </Button>
          <Button
            variant="contained"
            onClick={() => saveDependencyStatus(dependencyStatus)}
          >
            設定を保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
