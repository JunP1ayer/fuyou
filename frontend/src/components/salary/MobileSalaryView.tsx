import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Tabs, Tab, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, RadioGroup, Radio, Alert } from '@mui/material';
import { ChevronLeft, ChevronRight, AccountBalance, Star } from '@mui/icons-material';
// import { InfiniteCalendar } from '../calendar/InfiniteCalendar';
// import { useNavigate } from 'react-router-dom';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import useI18nStore from '../../store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import { BankingDashboard } from '../banking/BankingDashboard';

export const MobileSalaryView: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  // const navigate = useNavigate();
  const { shifts } = useSimpleShiftStore();
  const { language, country } = useI18nStore();
  const { t } = useI18n();
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
  
  // 扶養状況の初回設定チェック（給料管理画面初回アクセス時に表示）
  const [dependencySetupOpen, setDependencySetupOpen] = useState(() => {
    const hasDependencyStatus = localStorage.getItem('dependencyStatus');
    const hasVisitedSalaryView = localStorage.getItem('hasVisitedSalaryView');
    const isDeferred = localStorage.getItem('dependencySetupDeferred'); // 「あとで」を押したかどうか
    
    // 扶養設定が未設定 かつ (初回アクセス または 以前「あとで」を押した) 場合に表示
    return !hasDependencyStatus && (!hasVisitedSalaryView || isDeferred === 'true');
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
    // 設定完了時に「あとで」フラグをクリア
    localStorage.removeItem('dependencySetupDeferred');
    setDependencySetupOpen(false);
  };

  // 「あとで」ボタンの処理
  const handleDependencyDefer = () => {
    localStorage.setItem('dependencySetupDeferred', 'true');
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

  // 給料管理画面への初回訪問フラグを設定
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedSalaryView');
    if (!hasVisited) {
      localStorage.setItem('hasVisitedSalaryView', 'true');
    }
  }, []);

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
    yearHoursMin,
    yearEarningsJPY,
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

    return {
      monthHoursMin: minutes,
      monthEstJPY: est,
      yearHoursMin: yMinutes,
      yearEarningsJPY: yEarnings,
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
        <Tab value="month" label={t('salary.tab.month', '月')} sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab value="year" label={t('salary.tab.year', '年')} sx={{ fontSize: { xs: 12, sm: 14 } }} />
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
            aria-label={t('salary.nav.prevMonth', '前月')}
            onClick={() => setMonthOffset(o => o - 1)}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {shownDate.getFullYear()}年{shownDate.getMonth() + 1}月
          </Typography>
          <IconButton
            aria-label={t('salary.nav.nextMonth', '翌月')}
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
            aria-label={t('salary.nav.prevYear', '前年')}
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
            aria-label={t('salary.nav.nextYear', '翌年')}
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
          {t('salary.dependency', '扶養')}: {dependencyLimit.type}
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
                  {t('salary.monthly.status', '今月の収入状況')}
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
                      {t('salary.monthly.income', '今月の収入')}
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
                      {t('salary.limit', '扶養限度額')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(displayInfo.monthlyDependencyLimit)}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {t('salary.workHours', '勤務時間')}: {hours}h{mins}m
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
                  {t('salary.yearly.status', '年間収入状況')}
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
                      {t('salary.yearly.income', '年間収入')}
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
                      {t('salary.dependency.limit', '扶養限度額')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(dependencyLimit.limit)}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {t('salary.workHours', '勤務時間')}: {Math.floor(yearHoursMin / 60)}h{Math.floor(yearHoursMin % 60)}m
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
        {t('salary.changeDependency', '扶養設定を変更')}
      </Button>

      {/* 銀行連携UI */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('bank.link.title', '銀行連携')}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {t('bank.link.desc', '銀行口座と連携して、自動で収入データを取得・分析できます')}
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
              {t('bank.link.start', '銀行連携を開始')}
            </Button>
            <Button 
              variant="outlined"
              onClick={() => setBankingDashboardOpen(true)}
              sx={{ minWidth: 120 }}
            >
              {t('common.details', '詳細を見る')}
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {t('salary.dependency.check', '扶養状況の確認')}
          </Typography>
          <Typography variant="caption" component="p" color="text.secondary">
            {t('salary.dependency.check.desc', 'あなたに最適な扶養限度額を設定します')}
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
                {t('wizard.q.isStudent', 'あなたは学生ですか？')}
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
                  {t('common.yesStudent', 'はい、学生です')}
                </Button>
                <Button
                  variant={dependencyStatus.isStudent === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({...dependencyStatus, isStudent: false});
                    setTimeout(() => setCurrentStep(getAgeStep()), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  {t('common.noStudent', 'いいえ、学生ではありません')}
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 1: 年齢質問 */}
          {currentStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                {t('wizard.q.age', 'あなたの年齢を教えてください')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
                {t('wizard.q.age.desc', '扶養や健康保険の基準が年齢によって異なります')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'under20', label: t('wizard.age.under20', '19歳以下') },
                  { key: '20to22', label: t('wizard.age.20to22', '20〜22歳') },
                  { key: 'over23', label: t('wizard.age.over23', '23歳以上') }
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
                {t('wizard.q.studentDetail', 'あてはまるものがあれば教えてください')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'none', label: t('wizard.student.none', '該当なし') },
                  { key: 'leave', label: t('wizard.student.leave', '現在休学中') },
                  { key: 'night', label: t('wizard.student.night', '夜間・通信制の課程') },
                  { key: 'graduate_soon', label: t('wizard.student.graduateSoon', '来年3月に卒業予定') }
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
                {t('wizard.student.note', '学生でも働き方によって税の扱いが変わることがあります')}
              </Typography>
            </Box>
          )}

          {/* ステップ 3/2: 働き方について */}
          {currentStep === getWorkStyleStep() && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                {t('wizard.q.workstyle', 'あてはまる働き方があれば教えてください')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
                {t('wizard.q.workstyle.desc', 'わからなければ未選択でOKです')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  label={t('wizard.workstyle.week20', '週20時間以上で働く予定')}
                  color={dependencyStatus.weeklyHours20 ? 'primary' : 'default'}
                  variant={dependencyStatus.weeklyHours20 ? 'filled' : 'outlined'}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, weeklyHours20: !dependencyStatus.weeklyHours20 });
                  }}
                  sx={{ cursor: 'pointer', m: 0.5 }}
                />
                <Chip
                  label={t('wizard.workstyle.over2m', '同じ勤務先で2か月を超えて働く予定')}
                  color={dependencyStatus.contractLength === 'over2m' ? 'primary' : 'default'}
                  variant={dependencyStatus.contractLength === 'over2m' ? 'filled' : 'outlined'}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, contractLength: dependencyStatus.contractLength === 'over2m' ? 'under2m' : 'over2m' });
                  }}
                  sx={{ cursor: 'pointer', m: 0.5 }}
                />
                <Chip
                  label={t('wizard.workstyle.office51', '勤務先の従業員は51人以上')}
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
                  {t('common.next', '次へ')}
                </Button>
              </Box>
            </Box>
          )}

          {/* 最終ステップ: 結果表示 */}
          {currentStep === getTotalSteps() - 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                {t('wizard.result.title', 'あなたの推奨設定')}
              </Typography>
              <Box sx={{ p: 3, bgcolor: 'primary.lighter', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                  {t('wizard.result.yearLimit', '年間')} {Math.round(dependencyLimit.limit / 10000)}{t('wizard.result.manYen', '万円まで')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {dependencyLimit.type}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('wizard.result.monthlyHint', '残り月目安')}: {displayInfo.monthlyDependencyLimit.toLocaleString()}{t('wizard.result.yenPerMonth', '円/月')}
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
                  label={dependencyStatus.autoRecommend ? t('wizard.result.useAuto', '自動推奨を使用') : t('wizard.result.useManual', '手動で金額を指定')}
                />
              </Box>

              {!dependencyStatus.autoRecommend && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('wizard.result.pickAnnual', '年間上限を選択')}</InputLabel>
                    <Select
                      value={dependencyStatus.selectedLimit}
                      onChange={(e) => setDependencyStatus({ ...dependencyStatus, selectedLimit: Number(e.target.value) })}
                      label={t('wizard.result.pickAnnual', '年間上限を選択')}
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
              {t('common.previous', '前へ')}
            </Button>
          )}
          <Button onClick={handleDependencyDefer}>
            {t('common.later', 'あとで')}
          </Button>
          {currentStep === getTotalSteps() - 1 && (
            <Button
              variant="contained"
              onClick={() => saveDependencyStatus(dependencyStatus)}
            >
              {t('common.saveSettings', '設定を保存')}
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
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {t('salary.dependency.select', '扶養限度額を選択')}
          </Typography>
          <Typography variant="caption" component="p" color="text.secondary">
              {t('salary.dependency.current', '現在の設定')}: {dependencyLimit.type}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            icon={<Star />}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('salary.dependency.recommended', '推奨: 自動設定を選択すると、あなたの状況に最適な扶養限度額が自動計算されます')}
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('salary.dependency.select.desc', 'あなたに適した年間収入の扶養限度額を選択してください（一つだけ選択可能）')}
          </Typography>

          {/* RadioGroupで単一選択を保証 */}
          <RadioGroup
            value={dependencyStatus.autoRecommend ? 'auto' : dependencyStatus.selectedLimit?.toString()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'auto') {
                setDependencyStatus({ 
                  ...dependencyStatus, 
                  autoRecommend: true,
                  selectedLimit: null
                });
              } else {
                setDependencyStatus({ 
                  ...dependencyStatus, 
                  autoRecommend: false,
                  selectedLimit: Number(value)
                });
              }
            }}
          >
            {/* 自動推奨オプション（最上位に配置） */}
            <Card 
              sx={{ 
                mb: 2,
                border: dependencyStatus.autoRecommend ? 2 : 1,
                borderColor: dependencyStatus.autoRecommend ? 'success.main' : 'grey.300',
                bgcolor: dependencyStatus.autoRecommend ? 'success.lighter' : 'background.paper',
                position: 'relative'
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <FormControlLabel
                  value="auto"
                  control={<Radio color="success" />}
                  sx={{ m: 0, width: '100%' }}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', ml: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Star sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {t('salary.dependency.auto.title', '自動推奨（おすすめ）')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {t('salary.dependency.auto.desc', 'あなたの状況に最適な扶養限度額を自動計算')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                          ➤ 現在の推奨: {dependencyLimit.type}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            {/* 手動選択オプション */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
              または手動で金額を選択:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { value: 103, label: '103万円', desc: t('salary.dependency.option.103', '所得税の基礎控除額（一般的）') },
                { value: 106, label: '106万円', desc: t('salary.dependency.option.106', '社会保険加入の壁') },
                { value: 123, label: '123万円', desc: t('salary.dependency.option.123', '特定親族特別控除（2025年改正後）') },
                { value: 130, label: '130万円', desc: t('salary.dependency.option.130', '健康保険の被扶養者扶養限度額') },
                { value: 150, label: '150万円', desc: t('salary.dependency.option.150', '19-22歳健保被扶養（2025年改正後）') },
                { value: 160, label: '160万円', desc: t('salary.dependency.option.160', '学生特例最大扶養限度額（2025年改正後）') }
              ].map(option => (
                <Card 
                  key={option.value}
                  sx={{ 
                    border: (!dependencyStatus.autoRecommend && dependencyStatus.selectedLimit === option.value) ? 2 : 1,
                    borderColor: (!dependencyStatus.autoRecommend && dependencyStatus.selectedLimit === option.value) ? 'primary.main' : 'grey.300',
                    bgcolor: (!dependencyStatus.autoRecommend && dependencyStatus.selectedLimit === option.value) ? 'primary.lighter' : 'background.paper'
                  }}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <FormControlLabel
                      value={option.value.toString()}
                      control={<Radio />}
                      sx={{ m: 0, width: '100%' }}
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.desc}
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          </RadioGroup>

          {/* 現在の設定プレビュー */}
          <Alert 
            severity={dependencyStatus.autoRecommend ? 'success' : 'info'}
            sx={{ mt: 3 }}
            icon={dependencyStatus.autoRecommend ? <Star /> : undefined}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('salary.dependency.preview.title', '選択中の設定')}
            </Typography>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              color: dependencyStatus.autoRecommend ? 'success.main' : 'primary.main'
            }}>
              年間 {Math.round(
                (dependencyStatus.autoRecommend ? dependencyLimit.limit : (dependencyStatus.selectedLimit || 103) * 10000) / 10000
              )}万円まで
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {dependencyStatus.autoRecommend 
                ? `${dependencyLimit.type} （自動推奨）`
                : `${dependencyStatus.selectedLimit || 103}万円 （手動選択）`
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('wizard.result.monthlyHint', '残り月目安')}: {Math.floor(
                (dependencyStatus.autoRecommend ? dependencyLimit.limit : (dependencyStatus.selectedLimit || 103) * 10000) / 12
              ).toLocaleString()}円/月
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependencyRecheckOpen(false)}>{t('common.cancel', 'キャンセル')}</Button>
          <Button
            variant="contained"
            onClick={() => {
              saveDependencyStatus(dependencyStatus);
              setDependencyRecheckOpen(false);
            }}
          >
            {t('common.updateSettings', '設定を更新')}
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
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {t('bank.dashboard.title', '銀行連携ダッシュボード')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <BankingDashboard />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankingDashboardOpen(false)}>
            {t('common.close', '閉じる')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
