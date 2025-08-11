import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, Chip, Tabs, Tab, Link, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, AccountBalance } from '@mui/icons-material';
// import { InfiniteCalendar } from '../calendar/InfiniteCalendar';
// import { useNavigate } from 'react-router-dom';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import useI18nStore from '../../store/i18nStore';
import { BankingDashboard } from '../banking/BankingDashboard';

export const MobileSalaryView: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  // const navigate = useNavigate();
  const { shifts } = useSimpleShiftStore();
  const { language, country } = useI18nStore();
  const currency = ((): string => {
    switch (country) {
      case 'UK': return 'GBP';
      case 'DE': return 'EUR';
      case 'DK': return 'DKK';
      case 'FI': return 'EUR';
      case 'NO': return 'NOK';
      case 'AT': return 'EUR';
      case 'PL': return 'PLN';
      case 'HU': return 'HUF';
      case 'JP':
      default: return 'JPY';
    }
  })();
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Math.floor(amount));
  const [tabValue, setTabValue] = useState<'month' | 'year'>('month');
  const [monthOffset, setMonthOffset] = useState(0);
  
  // 扶養状況の初回設定チェック（アプリ起動時に必ず表示）
  const [dependencySetupOpen, setDependencySetupOpen] = useState(() => {
    const saved = localStorage.getItem('dependencyStatus');
    return !saved; // 未設定なら自動で開く
  });
  
  // 扶養再設定用の状態
  const [dependencyRecheckOpen, setDependencyRecheckOpen] = useState(false);
  
  // 銀行連携ダイアログ用の状態
  const [bankingDashboardOpen, setBankingDashboardOpen] = useState(false);
  
  
  // 扶養質問のステップ管理
  const [currentStep, setCurrentStep] = useState(0);
  // const [recheckCurrentStep, setRecheckCurrentStep] = useState(0);
  
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
      studentException: null, // 'leave' | 'night' | 'graduate_soon' | 'none' | null
      employmentType: null, // 'parttime', 'arbeit', 'contract'
      
      // 目標設定
      priority: null, // 'maxIncome', 'keepDependency', 'balance'
      autoRecommend: true,
      selectedLimit: null, // 自動計算される
    };
  });


  // 設定関連のstate
  // 削除: 未使用の設定ダイアログフラグ
  const [notifications] = useState(() => {
    const raw = localStorage.getItem('notifications');
    return raw ? JSON.parse(raw) : true;
  });
  const [appTheme] = useState(() => {
    const raw = localStorage.getItem('theme');
    return raw || 'light';
  });
  const [dataSync] = useState(() => {
    const raw = localStorage.getItem('dataSync');
    return raw ? JSON.parse(raw) : true;
  });


  // 扶養状況の保存
  const saveDependencyStatus = (status: any) => {
    setDependencyStatus(status);
    localStorage.setItem('dependencyStatus', JSON.stringify(status));
    setDependencySetupOpen(false);
  };
  
  // 扶養限度額の自動計算（2025年税制改正対応）
  const calculateDependencyLimit = () => {
    const s = dependencyStatus || {};

    // 手動設定が有効な場合は尊重
    if (s.autoRecommend === false && typeof s.selectedLimit === 'number') {
      return { limit: s.selectedLimit * 10000, type: `${s.selectedLimit}万円（手動）` };
    }

    const now = new Date();
    const reform2025Date = new Date(2025, 11, 1); // 2025年12月1日（所得税改正）
    const healthInsurance2025Date = new Date(2025, 9, 1); // 2025年10月1日（健保改正）
    const is2025Plus = now >= reform2025Date;
    const isHealthInsurance2025Plus = now >= healthInsurance2025Date;
    
    // 年齢判定（19-22歳かどうか）
    const is19to22 = s.age === 'under20' || s.age === '20to22';
    
    // 基本的な所得税の壁
    let limit = is2025Plus ? 1_600_000 : 1_030_000; // 160万円 vs 103万円
    let type = is2025Plus ? '160万円（2025年所得税改正）' : '103万円（現行所得税）';

    // 学生でない場合、または学生例外がある場合は低い基準
    if (s.isStudent === false || (s.studentException && s.studentException !== 'none')) {
      limit = is2025Plus ? 1_230_000 : 1_030_000; // 123万円 vs 103万円
      type = is2025Plus ? '123万円（特定親族特別控除）' : '103万円（現行）';
    }

    // 106万円（社保加入）の壁
    const weekly20 = s.weeklyHours20 === true || s.workHoursPerWeek === '20to30' || s.workHoursPerWeek === 'over30';
    const longContract = s.contractLength === 'over2m';
    const officeBig = s.officeSize51 === 'yes';
    if (weekly20 && longContract && officeBig) {
      limit = 1_060_000;
      type = '106万円（社会保険加入）';
    }

    // 健康保険の被扶養者の壁
    if (s.priority !== 'maxIncome') {
      if (is19to22 && isHealthInsurance2025Plus) {
        // 19-22歳は2025年10月から150万円
        limit = Math.min(limit, 1_500_000);
        type = '150万円（19-22歳健保被扶養）';
      } else {
        // 通常は130万円
        limit = Math.min(limit, 1_300_000);
        type = '130万円（健保被扶養）';
      }
    }

    // 最大収入志向の学生は160万円を目指す
    if (s.isStudent === true && s.priority === 'maxIncome' && (s.studentException === 'none' || !s.studentException)) {
      if (is2025Plus) {
        limit = 1_600_000;
        type = '160万円（学生最大）';
      } else {
        limit = 1_500_000;
        type = '150万円（学生特例）';
      }
    }

    // 扶養優先の場合は保守的に
    if (s.priority === 'keepDependency') {
      limit = is2025Plus ? 1_230_000 : 1_030_000;
      type = is2025Plus ? '123万円（扶養優先）' : '103万円（扶養優先）';
    }

    return { limit, type };
  };
  
  const dependencyLimit = calculateDependencyLimit();
  
  // 今年の残り稼げる金額（詳細）は集計後に計算
  // 削除: 未使用の残額計算プレースホルダー

  // 設定の永続化
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('theme', appTheme);
  }, [appTheme]);

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
      // ytdMonthJPY: ytdMonth,
      workplaceRows: rows,
      yearHoursMin: yMinutes,
      yearEarningsJPY: yEarnings,
      months: monthAgg,
    };
  }, [shifts]);

  // 残り許容量の詳細（必要時に使用）
  // 削除: 未使用の詳細計算
  /* const remainingAllowanceDetail = useMemo(() => {
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
  }, [dependencyLimit.limit, yearEarningsJPY]); */

  // 扶養状況ベースの表示内容計算
  const displayInfo = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const remainingMonths = 13 - currentMonth; // 来年1月まで含める
    
    // 個人の扶養設定に基づく動的月間目安計算
    const remainingAmount = Math.max(0, dependencyLimit.limit - yearEarningsJPY);
    const monthlyDependencyLimit = remainingMonths > 0 
      ? Math.floor(remainingAmount / remainingMonths) 
      : Math.floor(dependencyLimit.limit / 12); // フォールバック
    
    const yearlyProgress = Math.min(100, Math.round((yearEarningsJPY / dependencyLimit.limit) * 100));
    
    return {
      monthlyDependencyLimit,
      yearlyProgress,
      monthlyProgressRatio: monthEstJPY / monthlyDependencyLimit,
      yearlyProgressRatio: yearEarningsJPY / dependencyLimit.limit,
      remainingMonths,
      remainingAmount
    };
  }, [dependencyLimit.limit, monthEstJPY, yearEarningsJPY]);

  const hours = Math.floor(monthHoursMin / 60);
  const mins = Math.floor(monthHoursMin % 60);

  // ステップ管理のヘルパー関数
  const getTotalSteps = () => {
    if (dependencyStatus.isStudent) {
      return 5; // 学生 -> 年齢 -> 学生詳細 -> 働き方 -> 結果
    }
    return 4; // 学生でない -> 年齢 -> 働き方 -> 結果
  };

  const getAgeStep = () => {
    return dependencyStatus.isStudent ? 1 : 1;
  };

  const getStudentDetailStep = () => {
    return 2;
  };

  const getWorkStyleStep = () => {
    return dependencyStatus.isStudent ? 3 : 2;
  };

  // 未使用: ウィザードの次へ進む可否（表示では displayInfo を使用）

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      {/* タブ 月/年 */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant={isMobile ? 'fullWidth' : 'standard'}
        centered={!isMobile}
        sx={{ mb: 1, minHeight: 36, '& .MuiTab-root': { minHeight: 36 } }}
      >
        <Tab value="month" label="月" sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab value="year" label="年" sx={{ fontSize: { xs: 12, sm: 14 } }} />
      </Tabs>

      {/* ヘッダー タイトル（タブ別） */}
      {tabValue === 'month' ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            gap: 1,
          }}
        >
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

      {/* 扶養設定 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() => setDependencySetupOpen(true)}
          sx={{ borderRadius: 999 }}
        >
          扶養: {dependencyLimit.type}
        </Button>
      </Box>


      {/* 改善された収入表示 */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {tabValue === 'month' ? (
            <>
              {/* プログレスバー */}
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'grey.100',
                position: 'relative'
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${Math.min(displayInfo.monthlyProgressRatio * 100, 100)}%`,
                  backgroundColor: displayInfo.monthlyProgressRatio > 0.9 
                    ? 'error.main' 
                    : displayInfo.monthlyProgressRatio > 0.8 
                    ? 'warning.main' 
                    : 'success.main',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
              
              {/* メイン情報 */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  今月の収入状況
                </Typography>
                
                {/* 円形進捗表示 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    {/* SVG円グラフ */}
                    {displayInfo.monthlyProgressRatio > 0 ? (
                      <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                        {/* 背景円 */}
                        <circle
                          cx={60}
                          cy={60}
                          r={52}
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth={16}
                        />
                        {/* 進捗円 */}
                        <circle
                          cx={60}
                          cy={60}
                          r={52}
                          fill="none"
                          stroke={
                            displayInfo.monthlyProgressRatio > 0.9 
                              ? '#d32f2f' 
                              : displayInfo.monthlyProgressRatio > 0.8 
                              ? '#ed6c02' 
                              : '#2e7d32'
                          }
                          strokeWidth={16}
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(displayInfo.monthlyProgressRatio, 1))}`}
                          style={{
                            transition: 'stroke-dashoffset 0.5s ease-in-out'
                          }}
                        />
                      </svg>
                    ) : (
                      <svg width={120} height={120}>
                        <circle
                          cx={60}
                          cy={60}
                          r={52}
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth={16}
                        />
                      </svg>
                    )}
                    {/* 中央のパーセント表示 */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 800,
                        color: displayInfo.monthlyProgressRatio > 0.9 
                          ? 'error.main' 
                          : displayInfo.monthlyProgressRatio > 0.8 
                          ? 'warning.main' 
                          : 'success.main'
                      }}>
                        {Math.round(displayInfo.monthlyProgressRatio * 100)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  p: 2,
                  mb: 2
                }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary">
                      今月の収入
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(monthEstJPY)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                    /
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      限度額
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(displayInfo.monthlyDependencyLimit)}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  勤務時間: {hours}h{mins}m
                </Typography>
              </Box>
            </>
          ) : (
            <>
              {/* 年間プログレスバー */}
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'grey.100',
                position: 'relative'
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${Math.min(displayInfo.yearlyProgressRatio * 100, 100)}%`,
                  backgroundColor: displayInfo.yearlyProgressRatio > 0.9 
                    ? 'error.main' 
                    : displayInfo.yearlyProgressRatio > 0.7 
                    ? 'warning.main' 
                    : 'success.main',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
              
              {/* 年間メイン情報 */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  年間収入状況
                </Typography>
                
                {/* 年間円形進捗表示 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    {/* 年間SVG円グラフ */}
                    {displayInfo.yearlyProgressRatio > 0 ? (
                      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                        {/* 背景円 */}
                        <circle
                          cx={70}
                          cy={70}
                          r={60}
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth={20}
                        />
                        {/* 進捗円 */}
                        <circle
                          cx={70}
                          cy={70}
                          r={60}
                          fill="none"
                          stroke={
                            displayInfo.yearlyProgressRatio > 0.9 
                              ? '#d32f2f' 
                              : displayInfo.yearlyProgressRatio > 0.7 
                              ? '#ed6c02' 
                              : '#2e7d32'
                          }
                          strokeWidth={20}
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 60}`}
                          strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(displayInfo.yearlyProgressRatio, 1))}`}
                          style={{
                            transition: 'stroke-dashoffset 0.5s ease-in-out'
                          }}
                        />
                      </svg>
                    ) : (
                      <svg width={140} height={140}>
                        <circle
                          cx={70}
                          cy={70}
                          r={60}
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth={20}
                        />
                      </svg>
                    )}
                    {/* 中央のパーセント表示 */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography variant="h3" sx={{ 
                        fontWeight: 800,
                        color: displayInfo.yearlyProgressRatio > 0.9 
                          ? 'error.main' 
                          : displayInfo.yearlyProgressRatio > 0.7 
                          ? 'warning.main' 
                          : 'success.main'
                      }}>
                        {displayInfo.yearlyProgress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  p: 2,
                  mb: 2
                }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary">
                      年間収入
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(yearEarningsJPY)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                    /
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      扶養限度額
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(dependencyLimit.limit)}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  勤務時間: {Math.floor(yearHoursMin / 60)}h{Math.floor(yearHoursMin % 60)}m
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>



      {/* 扶養チェックボタン */}
      <Button 
        variant="contained" 
        color="primary"
        fullWidth 
        sx={{ mb: 2 }}
        onClick={() => setDependencyRecheckOpen(true)}
      >
        扶養設定を変更
      </Button>

      {/* 銀行連携UI */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              銀行連携
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            銀行口座と連携して、自動で収入データを取得・分析できます
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained"
              fullWidth
              onClick={() => setBankingDashboardOpen(true)}
              sx={{ 
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              銀行連携を開始
            </Button>
            <Button 
              variant="outlined"
              onClick={() => setBankingDashboardOpen(true)}
              sx={{ minWidth: 120 }}
            >
              詳細を見る
            </Button>
          </Box>
        </CardContent>
      </Card>


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
                    setTimeout(() => setCurrentStep(getAgeStep()), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  はい、学生です
                </Button>
                <Button
                  variant={dependencyStatus.isStudent === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({...dependencyStatus, isStudent: false});
                    setTimeout(() => setCurrentStep(getAgeStep()), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  いいえ、学生ではありません
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 1: 年齢質問 */}
          {currentStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あなたの年齢を教えてください
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
                扶養や健康保険の基準が年齢によって異なります
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'under20', label: '19歳以下' },
                  { key: '20to22', label: '20〜22歳' },
                  { key: 'over23', label: '23歳以上' }
                ].map(option => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    color={dependencyStatus.age === option.key ? 'primary' : 'default'}
                    variant={dependencyStatus.age === option.key ? 'filled' : 'outlined'}
                    onClick={() => {
                      setDependencyStatus({ ...dependencyStatus, age: option.key });
                      const nextStep = dependencyStatus.isStudent ? getStudentDetailStep() : getWorkStyleStep();
                      setTimeout(() => setCurrentStep(nextStep), 300);
                    }}
                    sx={{ cursor: 'pointer', m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* ステップ 2: 学生の場合の追加質問 */}
          {currentStep === 2 && dependencyStatus.isStudent && (
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

          {/* ステップ 3/2: 働き方について */}
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
                  残り月目安: {displayInfo.monthlyDependencyLimit.toLocaleString()}円/月
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
                      <MenuItem value={106}>106万円</MenuItem>
                      <MenuItem value={123}>123万円</MenuItem>
                      <MenuItem value={130}>130万円</MenuItem>
                      <MenuItem value={150}>150万円</MenuItem>
                      <MenuItem value={160}>160万円</MenuItem>
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

      {/* 扶養設定変更ダイアログ */}
      <Dialog
        open={dependencyRecheckOpen}
        onClose={() => setDependencyRecheckOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            扶養限度額を選択
          </Typography>
          <Typography variant="caption" color="text.secondary">
            現在の設定: {dependencyLimit.type}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            あなたに適した年間収入限度額を選択してください
          </Typography>

          {/* 金額選択オプション */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { value: 103, label: '103万円', desc: '所得税の基礎控除額（一般的）' },
              { value: 106, label: '106万円', desc: '社会保険加入の壁' },
              { value: 123, label: '123万円', desc: '特定親族特別控除（2025年改正後）' },
              { value: 130, label: '130万円', desc: '健康保険の被扶養者限度額' },
              { value: 150, label: '150万円', desc: '19-22歳健保被扶養（2025年改正後）' },
              { value: 160, label: '160万円', desc: '学生特例最大限度額（2025年改正後）' }
            ].map(option => (
              <Card 
                key={option.value}
                sx={{ 
                  cursor: 'pointer',
                  border: dependencyStatus.selectedLimit === option.value ? 2 : 1,
                  borderColor: dependencyStatus.selectedLimit === option.value ? 'primary.main' : 'grey.300',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => setDependencyStatus({ 
                  ...dependencyStatus, 
                  selectedLimit: option.value,
                  autoRecommend: false 
                })}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.desc}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: 2,
                      borderColor: dependencyStatus.selectedLimit === option.value ? 'primary.main' : 'grey.300',
                      backgroundColor: dependencyStatus.selectedLimit === option.value ? 'primary.main' : 'transparent'
                    }} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* 自動推奨オプション */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: dependencyStatus.autoRecommend ? 2 : 1,
                borderColor: dependencyStatus.autoRecommend ? 'success.main' : 'grey.300',
                '&:hover': { borderColor: 'success.main' }
              }}
              onClick={() => setDependencyStatus({ 
                ...dependencyStatus, 
                autoRecommend: true 
              })}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      自動推奨（おすすめ）
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      あなたの状況に最適な限度額を自動計算
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    border: 2,
                    borderColor: dependencyStatus.autoRecommend ? 'success.main' : 'grey.300',
                    backgroundColor: dependencyStatus.autoRecommend ? 'success.main' : 'transparent'
                  }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 現在の設定プレビュー */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              選択中の設定
            </Typography>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
              年間 {Math.round(
                (dependencyStatus.autoRecommend ? dependencyLimit.limit : (dependencyStatus.selectedLimit || 103) * 10000) / 10000
              )}万円まで
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {dependencyStatus.autoRecommend ? dependencyLimit.type : `${dependencyStatus.selectedLimit || 103}万円（手動選択）`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              月間目安: {Math.floor(
                (dependencyStatus.autoRecommend ? dependencyLimit.limit : (dependencyStatus.selectedLimit || 103) * 10000) / 12
              ).toLocaleString()}円/月
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

      {/* 銀行連携ダイアログ */}
      <Dialog 
        open={bankingDashboardOpen} 
        onClose={() => setBankingDashboardOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              銀行連携ダッシュボード
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <BankingDashboard />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankingDashboardOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
