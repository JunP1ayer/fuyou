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

      {/* 月間目標 行（チップ風） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
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
      </Box>

      {/* 円形カード：タブ別表示 */}
      {tabValue === 'month' ? (
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
              今日までの給料
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ¥{ytdMonthJPY.toLocaleString()}
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
    </Box>
  );
};
