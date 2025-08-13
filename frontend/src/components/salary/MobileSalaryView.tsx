import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Tabs, Tab, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, RadioGroup, Radio, Alert, Tooltip, TextField, InputAdornment, Snackbar } from '@mui/material';
import { ChevronLeft, ChevronRight, AccountBalance, Star, Info } from '@mui/icons-material';
// import { InfiniteCalendar } from '../calendar/InfiniteCalendar';
// import { useNavigate } from 'react-router-dom';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import useI18nStore from '../../store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import { BankingDashboard } from '../banking/BankingDashboard';
import { taxAndInsuranceZeroCap, Answers as ComboAnswers } from '@/lib/taxInsuranceZero';

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
  const [customZeroCap, setCustomZeroCap] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  
  
  // 扶養質問のステップ管理
  const [currentStep, setCurrentStep] = useState(0);
  // const [recheckCurrentStep, setRecheckCurrentStep] = useState(0);
  
  // 2025年税金チェック用の状態
  const [dependencyStatus, setDependencyStatus] = useState(() => {
    const saved = localStorage.getItem('dependencyStatus');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      age: null, // number
      isStudent: null, // boolean
      occupation: null, // 'university' | 'highschool' | 'worker' | 'freeter'
      isKinroStudent: null, // boolean (勤労学生控除の対象か)
      studentException: null, // 'leave' | 'night' | 'graduate_soon' | 'none'
      salaryOnly: null, // boolean (給与収入のみか)
      hasDependent: null, // boolean (家族の被扶養に入る予定があるか)
      meets106: null, // boolean (106万の全条件を満たしそうか)
      prefecture: 'default', // string (居住地、将来の自治体差対応用)
      manualLimit: null, // number (手動設定した上限: 106, 123, 130, 150)
      combinedLimitJPY: null, // number | null: 税金0&社保0の同時上限の保存値
      streakRuleEnabled: false, // 連続Nヶ月判定を使うか
      streakMonths: 3, // Nヶ月
      streakMonthlyThresholdJPY: 108334, // 月額基準（例：130万/12）
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
  
  // 2025年税制改正対応：税金ゼロ上限計算
  const calculateTaxZeroLimit = () => {
    const s = dependencyStatus || {};
    
    // 2025年基準（税金ゼロの正確な上限）
    const INCOME_TAX_ZERO_CAP = 1_600_000;        // 所得税ゼロ上限160万円
    const RESIDENT_TAX_ZERO_CAP = 1_100_000;      // 住民税ゼロ上限110万円（標準）
    const RESIDENT_TAX_ZERO_CAP_STUDENT = 1_340_000; // 勤労学生なら住民税ゼロ134万円
    
    // 手動設定の場合（税金ゼロのみを表示）
    if (s.manualLimit) {
      if (s.manualLimit === 110) {
        return { limit: 1_100_000, type: '110万円（一般・税金ゼロ上限）' };
      } else if (s.manualLimit === 123) {
        return { limit: 1_230_000, type: '123万円（扶養の目安）' };
      } else if (s.manualLimit === 130) {
        return { limit: 1_300_000, type: '130万円（被扶養者の壁）' };
      } else if (s.manualLimit === 134) {
        return { limit: 1_340_000, type: '134万円（学生・税金ゼロ上限）' };
      } else if (s.manualLimit === 150) {
        return { limit: 1_500_000, type: '150万円（学生特例）' };
      }
    }
    
    // 勤労学生控除の適用可否判定
    const canClaimKinroGakusei = () => {
      if (!s.isStudent) return false;
      if (!s.salaryOnly) return false;
      if (s.studentException === 'leave') return false; // 休学は在学要件を満たさない
      return true;
    };
    
    // 税金ゼロ上限の計算（min(所得税ゼロ, 住民税ゼロ)）
    const residentTaxCap = canClaimKinroGakusei() 
      ? RESIDENT_TAX_ZERO_CAP_STUDENT 
      : RESIDENT_TAX_ZERO_CAP;
    
    const limit = Math.min(INCOME_TAX_ZERO_CAP, residentTaxCap);
    
    if (canClaimKinroGakusei()) {
      return { limit, type: '134万円（学生・税金ゼロ上限）' };
    } else {
      return { limit, type: '110万円（一般・税金ゼロ上限）' };
    }
  };
  
  const dependencyLimit = useMemo(() => calculateTaxZeroLimit(), [dependencyStatus]);
  
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
    
    // combinedLimitJPYが設定されていればそれを使用、なければdependencyLimit.limitを使用
    const actualLimit = dependencyStatus.combinedLimitJPY || dependencyLimit.limit;
    
    // 個人の扶養設定に基づく動的月間目安計算
    const remainingAmount = Math.max(0, actualLimit - yearEarningsJPY);
    const monthlyDependencyLimit = remainingMonths > 0 
      ? Math.floor(remainingAmount / remainingMonths) 
      : Math.floor(actualLimit / 12); // フォールバック
    
    const yearlyProgress = Math.min(100, Math.round((yearEarningsJPY / actualLimit) * 100));
    
    return {
      monthlyDependencyLimit,
      yearlyProgress,
      monthlyProgressRatio: monthEstJPY / monthlyDependencyLimit,
      yearlyProgressRatio: yearEarningsJPY / actualLimit,
      remainingMonths,
      remainingAmount,
      actualLimit
    };
  }, [dependencyLimit.limit, dependencyStatus.combinedLimitJPY, monthEstJPY, yearEarningsJPY]);

  const hours = Math.floor(monthHoursMin / 60);
  const mins = Math.floor(monthHoursMin % 60);

  // 新しいステップ管理（2025年税金チェック用）
  const getTotalSteps = () => {
    return 8; // 開始 -> 年齢 -> 職業 -> 勤労学生 -> 収入区分 -> 被扶養 -> 106要件 -> 結果
  };

  const shouldShowStudentStep = () => {
    return dependencyStatus.isStudent === true;
  };

  // 未使用: ウィザードの次へ進む可否（表示では displayInfo を使用）

  return (
    <Box sx={{ p: { xs: 0.75, sm: 1.5 } }}>
      {/* カレンダー準拠の年月ヘッダー（左右に月切替矢印） */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
        <IconButton
          aria-label={t('salary.nav.prev', '前へ')}
          onClick={() => setMonthOffset(o => tabValue === 'month' ? o - 1 : o - 12)}
          size="small"
          sx={{ position: 'absolute', left: 0, '& .MuiSvgIcon-root': { fontSize: 20 } }}
        >
          <ChevronLeft />
        </IconButton>
        <Typography variant={isMobile ? 'h5' : 'h6'} sx={{ fontWeight: 700 }}>
          {shownDate.getFullYear()}{tabValue === 'month' ? `/${shownDate.getMonth() + 1}` : ''}
        </Typography>
        <IconButton
          aria-label={t('salary.nav.next', '次へ')}
          onClick={() => setMonthOffset(o => tabValue === 'month' ? o + 1 : o + 12)}
          size="small"
          sx={{ position: 'absolute', right: 0, '& .MuiSvgIcon-root': { fontSize: 20 } }}
        >
          <ChevronRight />
        </IconButton>
      </Box>
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

      {/* 旧ミニヘッダー（年月+矢印）は削除 */}

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
          {dependencyStatus.combinedLimitJPY
            ? `ゼロ負担上限: ¥${Number(dependencyStatus.combinedLimitJPY).toLocaleString()}`
            : `税金上限: ${dependencyLimit.type}`}
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
                      <Typography variant="h3" sx={{ 
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
                      {t('salary.limit', '月間目安')}
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
              {/* プログレスバー */}
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
              
              {/* メイン情報 */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  {t('salary.yearly.status', '年間収入状況')}
                </Typography>
                
                {/* 円形進捗表示 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    {/* SVG円グラフ */}
                    {displayInfo.yearlyProgressRatio > 0 ? (
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
                            displayInfo.yearlyProgressRatio > 0.9 
                              ? '#d32f2f' 
                              : displayInfo.yearlyProgressRatio > 0.7 
                              ? '#ed6c02' 
                              : '#2e7d32'
                          }
                          strokeWidth={16}
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(displayInfo.yearlyProgressRatio, 1))}`}
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
                      {t('salary.limit', '扶養限度額')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMoney(displayInfo.actualLimit)}
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



      {/* 税金上限再設定ボタン */}
      <Button 
        variant="contained" 
        color="primary"
        fullWidth 
        sx={{ mb: 2 }}
        onClick={() => setDependencyRecheckOpen(true)}
      >
        税金上限を再設定
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
              onClick={() => {
                setSnackMessage('銀行連携機能は現在開発中です。順次公開予定ですのでお楽しみに！');
                setSnackOpen(true);
              }}
              sx={{ 
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              {t('bank.link.start', '銀行連携を開始')}
            </Button>
            <Button 
              variant="outlined"
              onClick={() => {
                setSnackMessage('銀行連携機能は現在開発中です。順次公開予定ですのでお楽しみに！');
                setSnackOpen(true);
              }}
              sx={{ minWidth: 120 }}
            >
              {t('common.details', '詳細を見る')}
            </Button>
          </Box>
        </CardContent>
      </Card>


      {/* 2025年税金チェック ダイアログ */}
      <Dialog
        open={dependencySetupOpen}
        onClose={() => setDependencySetupOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            税金0 & 社保0 上限チェック
          </Typography>
          <Typography variant="caption" component="p" color="text.secondary">
            2025年法令準拠 / 簡易判定
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* 進捗ドット */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
            {Array.from({ length: getTotalSteps() }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: i <= currentStep ? 'primary.main' : 'grey.300',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </Box>

          {/* ステップ 0: 開始ページ */}
          {currentStep === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                税金も社会保険も払わずに済む<br />上限額をチェックしましょう
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => setCurrentStep(1)}
                sx={{ py: 2, px: 4, fontSize: '1.1rem', fontWeight: 600, mb: 3 }}
              >
                チェックスタート
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Tooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        注意事項
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • 2025年法令を反映した簡易版です
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • 本人が支払う税金（所得税・住民税）のみ対象
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • 社会保険は含みません
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        • 住民税は翌年度課税、自治体により僅差あり
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  注意事項
                </Typography>
              </Box>
            </Box>
          )}

          {/* ステップ 1: 年齢選択 */}
          {currentStep === 1 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                あなたの年齢を選択してください
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { key: 'under20', label: '19歳以下', value: 18 },
                  { key: '20to22', label: '20〜22歳', value: 21 },
                  { key: '23to25', label: '23〜25歳', value: 24 },
                  { key: 'over26', label: '26歳以上', value: 26 }
                ].map(option => (
                  <Button
                    key={option.key}
                    variant={dependencyStatus.age === option.value ? "contained" : "outlined"}
                    onClick={() => {
                      setDependencyStatus({ ...dependencyStatus, age: option.value });
                      setTimeout(() => setCurrentStep(2), 300);
                    }}
                    sx={{ py: 2, justifyContent: 'flex-start' }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* ステップ 2: 職業セレクト */}
          {currentStep === 2 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                あなたの職業を選択してください
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { key: 'university', label: '大学生・大学院生', isStudent: true },
                  { key: 'highschool', label: '高校生', isStudent: true },
                  { key: 'worker', label: '社会人（正社員・契約社員）', isStudent: false },
                  { key: 'freeter', label: 'フリーター・パート', isStudent: false }
                ].map(option => (
                  <Button
                    key={option.key}
                    variant={dependencyStatus.occupation === option.key ? "contained" : "outlined"}
                    onClick={() => {
                      setDependencyStatus({
                        ...dependencyStatus,
                        occupation: option.key,
                        isStudent: option.isStudent
                      });
                      // 学生を選んだ場合でも、学生例外の個別質問はスキップし、次の収入区分へ進む
                      setTimeout(() => setCurrentStep(4), 300);
                    }}
                    sx={{ py: 2, justifyContent: 'flex-start' }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* ステップ 3: 勤労学生該当チェック（学生時のみ） - 今回はスキップ */}
          {false && currentStep === 3 && dependencyStatus.isStudent && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                あてはまるものがあれば選択してください
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block', textAlign: 'center' }}>
                勤労学生控除の適用判定に使用します
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'none', label: '該当なし' },
                  { key: 'leave', label: '現在休学中' },
                  { key: 'night', label: '夜間・通信制の課程' },
                  { key: 'graduate_soon', label: '来年3月に卒業予定で同一事業所継続予定' }
                ].map(option => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    color={dependencyStatus.studentException === option.key ? 'primary' : 'default'}
                    variant={dependencyStatus.studentException === option.key ? 'filled' : 'outlined'}
                    onClick={() => {
                      setDependencyStatus({ ...dependencyStatus, studentException: option.key });
                    }}
                    sx={{ cursor: 'pointer', m: 0.5 }}
                  />
                ))}
              </Box>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => setCurrentStep(4)}
                  disabled={!dependencyStatus.studentException}
                >
                  次へ
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 4: 収入区分チェック */}
          {currentStep === 4 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                今年の収入について教えてください
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant={dependencyStatus.salaryOnly === true ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, salaryOnly: true });
                    setTimeout(() => setCurrentStep(5), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  給与収入のみ<br />
                  <Typography variant="caption">(アルバイト・パート)</Typography>
                </Button>
                <Button
                  variant={dependencyStatus.salaryOnly === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, salaryOnly: false });
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  その他の収入もある<br />
                  <Typography variant="caption">(事業・投資など)</Typography>
                </Button>
              </Box>
              {dependencyStatus.salaryOnly === false && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                  <Typography variant="body2" color="warning.dark">
                    申し訳ございません。給与収入以外がある場合は、今回の簡易チェックの対象外です。
                    詳細は税務署または税理士にご相談ください。
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ステップ 5: 被扶養（家族の健保） */}
          {currentStep === 5 && dependencyStatus.salaryOnly && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center' }}>
                家族の健康保険の“家族（被扶養者）”として入っていますか？
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
                自分の会社の社保「本人」や、国民健康保険なら「いいえ」を選んでください。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant={dependencyStatus.hasDependent === true ? "contained" : "outlined"}
                  onClick={() => {
                    const isStu = dependencyStatus.isStudent === true;
                    setDependencyStatus({ ...dependencyStatus, hasDependent: true });
                    setTimeout(() => setCurrentStep(isStu ? 7 : 6), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  はい（家族の健保の家族として加入・加入予定）
                </Button>
                <Button
                  variant={dependencyStatus.hasDependent === false ? "contained" : "outlined"}
                  onClick={() => {
                    const isStu = dependencyStatus.isStudent === true;
                    setDependencyStatus({ ...dependencyStatus, hasDependent: false });
                    setTimeout(() => setCurrentStep(isStu ? 7 : 6), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  いいえ（自分の社保「本人」/ 国民健康保険）
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 6: 106万円の要件まとめ */}
          {currentStep === 6 && dependencyStatus.salaryOnly && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center' }}>
                次の“すべて”に当てはまりますか？
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', lineHeight: 1.6 }}>
                週20h以上・雇用2か月超・従業員51人以上（任意特定含む）・月額8.8万円以上。<br />
                学生は原則対象外（休学・夜間・通信・卒後継続は対象になり得る）。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant={dependencyStatus.meets106 === true ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, meets106: true });
                    setTimeout(() => setCurrentStep(7), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  はい（全てに該当）
                </Button>
                <Button
                  variant={dependencyStatus.meets106 === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, meets106: false });
                    setTimeout(() => setCurrentStep(7), 300);
                  }}
                  sx={{ flex: 1, py: 2 }}
                >
                  いいえ（どれか満たさない）
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 7: 結果表示（税金0 & 社保0の同時上限） */}
          {currentStep === 7 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                あなたの「税金0 & 社保0」の同時上限
              </Typography>
              {(() => {
                const a: ComboAnswers = {
                  age: dependencyStatus.age || 0,
                  isStudent: !!dependencyStatus.isStudent,
                  studentStatus: (dependencyStatus.studentException as any) || 'none',
                  salaryOnly: dependencyStatus.salaryOnly === true,
                  hasDependent: dependencyStatus.hasDependent === true,
                  weeklyHours20Plus: dependencyStatus.meets106 === true,
                  monthsOver2: dependencyStatus.meets106 === true,
                  employer51Plus: dependencyStatus.meets106 === true,
                  monthlyWageJPY: dependencyStatus.meets106 === true ? 88000 : 0,
                  studentException: !!(dependencyStatus.studentException && dependencyStatus.studentException !== 'none'),
                  prefecture: dependencyStatus.prefecture,
                  manualLimit: null,
                };
                const combined = taxAndInsuranceZeroCap(a);
                const hero = combined.capJPY;
                return (
                  <>
                    <Box sx={{ p: 4, bgcolor: 'primary.lighter', borderRadius: 3, mb: 2 }}>
                      <Typography variant="h2" color="primary.main" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                        {hero !== null ? `¥${hero.toLocaleString()}` : '—'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      税金ゼロと社会保険ゼロを同時に満たすための上限です。
                    </Typography>
                    <Box sx={{ textAlign: 'left', mx: 'auto', maxWidth: 420 }}>
                      {combined.reasons.map((r, i) => (
                        <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          ・{r}
                        </Typography>
                      ))}
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (hero != null) {
                            const newStatus = { ...dependencyStatus, combinedLimitJPY: hero };
                            saveDependencyStatus(newStatus);
                          }
                        }}
                      >
                        この上限で設定
                      </Button>
                    </Box>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {currentStep > 0 && currentStep <= 7 && (
            <Button 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              startIcon={<ChevronLeft />}
              sx={{ mr: 'auto' }}
            >
              戻る
            </Button>
          )}
          {currentStep === 0 && (
            <Button onClick={handleDependencyDefer}>
              あとで
            </Button>
          )}
          {currentStep === 6 && (
            <Button
              variant="contained"
              onClick={() => saveDependencyStatus(dependencyStatus)}
            >
              設定を保存
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 税金上限変更ダイアログ */}
      <Dialog
        open={dependencyRecheckOpen}
        onClose={() => setDependencyRecheckOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            ゼロ負担上限を変更
          </Typography>
          <Typography variant="caption" component="p" color="text.secondary">
            現在の設定: {dependencyStatus.combinedLimitJPY ? `¥${Number(dependencyStatus.combinedLimitJPY).toLocaleString()}` : dependencyLimit.type}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            「税金0 & 社保0」の同時上限をもう一度チェックするか、税金のみの上限を手動で選べます。
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setCurrentStep(0);
                setDependencyRecheckOpen(false);
                setDependencySetupOpen(true);
              }}
              sx={{ py: 2 }}
            >
              ゼロ負担上限を再チェック
            </Button>
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
              または「税金のみ」を手動で選択
            </Typography>
            
            {[
              { value: 110, label: '110万円', desc: '一般の税金ゼロ上限（社保は別判定）' },
              { value: 123, label: '123万円', desc: '扶養の目安（2025年改正・原則）' },
              { value: 130, label: '130万円', desc: '被扶養者の壁（健康保険）' },
              { value: 134, label: '134万円', desc: '学生の税金ゼロ上限（社保は別判定／勤労学生控除）' },
              { value: 150, label: '150万円', desc: '学生特例の満額ライン（19〜22歳）' }
            ].map(option => (
              <Button
                key={option.value}
                variant="outlined"
                onClick={() => {
                  const newStatus = {
                    ...dependencyStatus,
                    isStudent: option.value === 134 || option.value === 150,
                    salaryOnly: true,
                    studentException: (option.value === 134 || option.value === 150) ? 'none' : null,
                    manualLimit: option.value
                  };
                  saveDependencyStatus(newStatus);
                  setDependencyRecheckOpen(false);
                }}
                sx={{ py: 2, textAlign: 'left', justifyContent: 'flex-start' }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.desc}
                  </Typography>
                </Box>
              </Button>
            ))}

            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>手動入力（任意の上限額を設定）</Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="1,230,000"
                value={customZeroCap}
                onChange={(e) => setCustomZeroCap(e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end">円</InputAdornment> }}
              />
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    const num = Number(String(customZeroCap).replace(/[^\d]/g, ''));
                    if (!num || num <= 0) return;
                    const newStatus = { ...dependencyStatus, combinedLimitJPY: num, manualLimit: null };
                    saveDependencyStatus(newStatus);
                    setDependencyRecheckOpen(false);
                    setCustomZeroCap('');
                  }}
                >
                  この金額で設定
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                入力した額は「ゼロ負担上限」として保存されます（税金・社保の自動チェックは行いません）。
              </Typography>
            </Box>
             <Box sx={{ mt: 2 }}>
               <Typography variant="subtitle2" sx={{ mb: 1 }}>連続月の上限チェック（任意設定）</Typography>
               <FormControlLabel
                 control={<Switch checked={!!dependencyStatus.streakRuleEnabled} onChange={(e) => setDependencyStatus({ ...dependencyStatus, streakRuleEnabled: e.target.checked })} />}
                 label="連続で一定額を超えたらアラート"
               />
               <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                 <TextField
                   size="small"
                   label="連続ヶ月"
                   type="number"
                   value={dependencyStatus.streakMonths}
                   onChange={(e) => setDependencyStatus({ ...dependencyStatus, streakMonths: Math.max(1, Number(e.target.value)) })}
                   sx={{ width: 120 }}
                   inputProps={{ min: 1 }}
                 />
                 <TextField
                   size="small"
                   label="月額しきい値"
                   type="number"
                   value={dependencyStatus.streakMonthlyThresholdJPY}
                   onChange={(e) => setDependencyStatus({ ...dependencyStatus, streakMonthlyThresholdJPY: Math.max(0, Number(e.target.value)) })}
                   InputProps={{ endAdornment: <InputAdornment position="end">円</InputAdornment> }}
                 />
               </Box>
               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                 例：3ヶ月連続で月{Number(dependencyStatus.streakMonthlyThresholdJPY).toLocaleString()}円を超えたら通知。健保の被扶養運用で“継続性”を重視するケースへの自衛設定です（組合により基準差）。
               </Typography>
             </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependencyRecheckOpen(false)}>キャンセル</Button>
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

      {/* スナックバー */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity="info" variant="filled" sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
};
