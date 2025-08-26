import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Tabs, Tab, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, RadioGroup, Radio, Alert, Tooltip, TextField, InputAdornment, Snackbar, LinearProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore, AccountBalance, Star, Info, CheckCircle, Warning, Settings } from '@mui/icons-material';
// import { InfiniteCalendar } from '../calendar/InfiniteCalendar';
// import { useNavigate } from 'react-router-dom';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import { useCalendarStore } from '../../store/calendarStore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import useI18nStore from '../../store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import { BankingDashboard } from '../banking/BankingDashboard';
import { taxAndInsuranceZeroCap, Answers as ComboAnswers } from '@/lib/taxInsuranceZero';
import { getPaymentMonth, DEFAULT_PAYMENT_SCHEDULE } from '@/utils/salaryCalculation';
import { useUserProfileStore, getUserProfileStatus } from '../../store/userProfileStore';
import { FuyouCheckDialog } from '../FuyouCheckDialog';

interface MobileSalaryViewProps {
  showFirstTimeResults?: boolean;
}

export const MobileSalaryView: React.FC<MobileSalaryViewProps> = ({ showFirstTimeResults = false }) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  // const navigate = useNavigate();
  const { shifts, workplaces } = useSimpleShiftStore();
  const { events } = useCalendarStore();
  const { language, country } = useI18nStore();
  const { t } = useI18n();
  
  // 新しい扶養チェックストア
  const { 
    fuyouCheckResult, 
    hasCompletedFuyouCheck, 
    hasViewedSalaryTab, 
    markSalaryTabViewed, 
    showFuyouCheck 
  } = useUserProfileStore();
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
  
  // 新しい扶養チェックダイアログの状態
  const [fuyouCheckOpen, setFuyouCheckOpen] = useState(false);
  
  // 扶養状況の初回設定チェック（ログイン後すぐに表示）
  const [dependencySetupOpen, setDependencySetupOpen] = useState(() => {
    const hasDependencyStatus = localStorage.getItem('dependencyStatus');
    
    // 扶養設定が未設定の場合、ログイン後すぐに表示
    return Boolean(!hasDependencyStatus);
  });
  
  // 扶養再設定用の状態
  const [dependencyRecheckOpen, setDependencyRecheckOpen] = useState(false);

  // 初回給料タブ表示時の結果表示状態
  const [firstTimeResultsOpen, setFirstTimeResultsOpen] = useState(false);
  
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
      hasThreeSiblings: null, // boolean (三人以上兄弟がいるか)
      salaryOnly: null, // boolean (給与収入のみか)
      hasDependent: null, // boolean (家族の被扶養に入る予定があるか)
      meets106: null, // boolean (106万の全条件を満たしそうか)
      prefecture: 'default', // string (居住地、将来の自治体差対応用)
      manualLimit: 130, // number (手動設定した上限: 106, 123, 130, 150) - デフォルトを130万円に
      combinedLimitJPY: 1300000, // number | null: デフォルトを130万円に設定
      streakRuleEnabled: false, // 連続Nヶ月判定を使うか
      streakMonths: 3, // Nヶ月
      streakMonthlyThresholdJPY: 108334, // 月額基準（例：130万/12）
    };
  });

  // ステップ1の選択インデックス
  const [step1SelectedIndex, setStep1SelectedIndex] = useState(
    dependencyStatus.age ? [18, 21, 24, 26].indexOf(dependencyStatus.age) : 0
  );
  
  // ステップ2の選択インデックス
  const [step2SelectedIndex, setStep2SelectedIndex] = useState(
    dependencyStatus.occupation ? 
    ['university', 'highschool', 'worker', 'freeter'].indexOf(dependencyStatus.occupation) : 0
  );

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

  // 給料タブ初回表示処理
  React.useEffect(() => {
    // 初回給料タブ表示の処理
    if (!hasViewedSalaryTab) {
      markSalaryTabViewed();
      
      // 扶養チェックが完了していない場合はダイアログ表示
      if (!hasCompletedFuyouCheck) {
        setFuyouCheckOpen(true);
      }
    }
  }, [hasViewedSalaryTab, hasCompletedFuyouCheck, markSalaryTabViewed]);
      }
    }
  }, [showFirstTimeResults]);

  // 扶養状況の保存
  const saveDependencyStatus = (status: any) => {
    setDependencyStatus(status);
    localStorage.setItem('dependencyStatus', JSON.stringify(status));
    // 設定完了時に「あとで」フラグをクリア
    localStorage.removeItem('dependencySetupDeferred');
    setDependencySetupOpen(false);
    // 初回結果表示は給料タブを開いた時のみ（ここでは表示しない）
    // setFirstTimeResultsOpen(true);
  };

  // 「あとで」ボタンの処理
  const handleDependencyDefer = () => {
    // 「あとで」を押した場合、チェックを閉じるだけ
    setDependencySetupOpen(false);
  };

  const handleFirstTimeResultsClose = () => {
    localStorage.setItem('hasShownSalaryResults', 'true');
    setFirstTimeResultsOpen(false);
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

    // 職場の締日・支給日情報を取得する関数
    const getWorkplaceSchedule = (workplaceName: string) => {
      const workplace = workplaces.find(w => w.name === workplaceName);
      if (workplace && 
          typeof (workplace as any).cutoffDay === 'number' && 
          typeof (workplace as any).paymentDay === 'number' && 
          typeof (workplace as any).paymentTiming === 'string') {
        return {
          cutoffDay: (workplace as any).cutoffDay,
          paymentDay: (workplace as any).paymentDay,
          paymentTiming: (workplace as any).paymentTiming as 'nextMonth' | 'sameMonth'
        };
      }
      return DEFAULT_PAYMENT_SCHEDULE;
    };

    // 既存のシフトデータを処理（締日・支給日考慮）
    shifts.forEach(s => {
      const d = new Date(s.date);
      const schedule = getWorkplaceSchedule(s.workplaceName);
      const paymentMonth = getPaymentMonth(s.date, schedule);
      
      const start = new Date(`2000-01-01T${s.startTime}`);
      const end = new Date(`2000-01-01T${s.endTime}`);
      const diffMin = Math.max(0, (end.getTime() - start.getTime()) / 60000);

      // 表示中の月の支給分かチェック
      if (paymentMonth === ymKey) {
        minutes += diffMin;
        est += s.totalEarnings;
        const row = (perWorkplace[s.workplaceName] ||= { hoursMin: 0, est: 0 });
        row.hoursMin += diffMin;
        row.est += s.totalEarnings;
      }
      
      // 当月までの合計（支給月ベース）
      const paymentDate = new Date(paymentMonth + '-01');
      const shownMonthDate = new Date(ymKey + '-01');
      // 支給月が表示月以前で、かつシフト実働日が今日以前の場合のみ集計
      if (paymentDate.getTime() <= shownMonthDate.getTime() && d <= now) {
        ytdMonth += s.totalEarnings;
      }

      // 年集計（支給年ベース）
      const paymentYear = parseInt(paymentMonth.split('-')[0]);
      if (paymentYear === shownDate.getFullYear()) {
        yMinutes += diffMin;
        yEarnings += s.totalEarnings;
        const key = paymentMonth.split('-')[1];
        if (!monthAgg[key]) monthAgg[key] = { earnings: 0, minutes: 0 };
        monthAgg[key].earnings += s.totalEarnings;
        monthAgg[key].minutes += diffMin;
      }
    });

    // カレンダーのシフトイベントも処理（締日・支給日考慮）
    events
      .filter(event => event.type === 'shift' && event.startTime && event.endTime)
      .forEach(event => {
        const d = new Date(event.date);
        const workplaceName = event.workplace?.name || event.title || '不明';
        const schedule = getWorkplaceSchedule(workplaceName);
        const paymentMonth = getPaymentMonth(event.date, schedule);
        
        const start = new Date(`2000-01-01T${event.startTime}`);
        let end = new Date(`2000-01-01T${event.endTime}`);
        
        // 終了時間が開始時間より早い場合は翌日とみなす
        if (end.getTime() <= start.getTime()) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
        
        const diffMin = Math.max(0, (end.getTime() - start.getTime()) / 60000);
        const earnings = event.earnings || 0;

        // 表示中の月の支給分かチェック
        if (paymentMonth === ymKey) {
          minutes += diffMin;
          est += earnings;
          const row = (perWorkplace[workplaceName] ||= { hoursMin: 0, est: 0 });
          row.hoursMin += diffMin;
          row.est += earnings;
        }
        
        // 当月までの合計（支給月ベース）
        const paymentDate = new Date(paymentMonth + '-01');
        const shownMonthDate = new Date(ymKey + '-01');
        // 支給月が表示月以前で、かつシフト実働日が今日以前の場合のみ集計
        if (paymentDate.getTime() <= shownMonthDate.getTime() && d <= now) {
          ytdMonth += earnings;
        }

        // 年集計（支給年ベース）
        const paymentYear = parseInt(paymentMonth.split('-')[0]);
        if (paymentYear === shownDate.getFullYear()) {
          yMinutes += diffMin;
          yEarnings += earnings;
          const key = paymentMonth.split('-')[1];
          if (!monthAgg[key]) monthAgg[key] = { earnings: 0, minutes: 0 };
          monthAgg[key].earnings += earnings;
          monthAgg[key].minutes += diffMin;
        }
      });

    return {
      monthHoursMin: minutes,
      monthEstJPY: est,
      yearHoursMin: yMinutes,
      yearEarningsJPY: yEarnings,
    };
  }, [shifts, events, workplaces, shownDate, now, ymKey]);

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

  // 扶養状況ベースの表示内容計算（シンプル版：扶養額÷12）
  const displayInfo = useMemo(() => {
    // combinedLimitJPYが設定されていればそれを使用、なければdependencyLimit.limitを使用
    const actualLimit = dependencyStatus.combinedLimitJPY || dependencyLimit.limit;
    
    // シンプルに年間限度額を12で割った月間目安（千の位以下切り捨て）
    const monthlyDependencyLimit = Math.floor(actualLimit / 12 / 1000) * 1000;
    
    // 残額計算
    const remainingAmount = Math.max(0, actualLimit - yearEarningsJPY);
    
    const yearlyProgress = Math.min(100, Math.round((yearEarningsJPY / actualLimit) * 100));
    
    return {
      monthlyDependencyLimit,
      yearlyProgress,
      monthlyProgressRatio: monthEstJPY / monthlyDependencyLimit,
      yearlyProgressRatio: yearEarningsJPY / actualLimit,
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

      {/* 新しい扶養チェック結果表示 */}
      {hasCompletedFuyouCheck && fuyouCheckResult && (
        <Card sx={{ mb: 2, background: `linear-gradient(135deg, ${
          fuyouCheckResult.riskLevel === 'safe' ? '#e8f5e8' : 
          fuyouCheckResult.riskLevel === 'warning' ? '#fff3e0' : '#ffebee'
        }, ${
          fuyouCheckResult.riskLevel === 'safe' ? '#f1f8e9' : 
          fuyouCheckResult.riskLevel === 'warning' ? '#fce4ec' : '#ffcdd2'
        })` }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {fuyouCheckResult.riskLevel === 'safe' && <CheckCircle sx={{ color: 'success.main' }} />}
                {fuyouCheckResult.riskLevel === 'warning' && <Warning sx={{ color: 'warning.main' }} />}
                {fuyouCheckResult.riskLevel === 'danger' && <Warning sx={{ color: 'error.main' }} />}
                
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  扶養チェック結果
                </Typography>
              </Box>
              
              <Button
                size="small"
                startIcon={<Settings />}
                onClick={() => setFuyouCheckOpen(true)}
                sx={{ fontSize: '0.8rem' }}
              >
                再設定
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justify: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  あと稼げる金額
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: fuyouCheckResult.riskLevel === 'safe' ? 'success.main' : fuyouCheckResult.riskLevel === 'warning' ? 'warning.main' : 'error.main' }}>
                  ¥{fuyouCheckResult.remainingAmount.toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  扶養限度額
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {fuyouCheckResult.selectedLimit}万円
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={Math.min((fuyouCheckResult.currentYearEarnings / (fuyouCheckResult.selectedLimit * 10000)) * 100, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: fuyouCheckResult.riskLevel === 'safe' ? 'success.main' : 
                          fuyouCheckResult.riskLevel === 'warning' ? 'warning.main' : 'error.main',
                },
              }}
            />
            
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
              {(fuyouCheckResult.currentYearEarnings / 10000).toFixed(0)}万円 / {fuyouCheckResult.selectedLimit}万円 使用
              ({((fuyouCheckResult.currentYearEarnings / (fuyouCheckResult.selectedLimit * 10000)) * 100).toFixed(0)}%)
            </Typography>
          </CardContent>
        </Card>
      )}

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
              {/* メイン情報 */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  {t('salary.monthly.status', '今月の収入')}
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
                      {t('salary.monthly.income', '収入')}
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
              {/* メイン情報 */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  {t('salary.yearly.status', '年間収入')}
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
                      {t('salary.yearly.income', '収入')}
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

      {/* 銀行連携（今後のアップデート） - 非表示 */}
      {false && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <AccountBalance sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                銀行連携
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              自動でデータ取得・分析
            </Typography>
            
            <Typography variant="caption" color="text.disabled">
              今後のアップデートでお楽しみに！
            </Typography>
          </CardContent>
        </Card>
      )}


      {/* 2025年税金チェック ダイアログ */}
      <Dialog
        open={dependencySetupOpen}
        onClose={() => setDependencySetupOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          py: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' }, whiteSpace: 'nowrap' }}>
            税金0 & 社保0
          </Typography>
          <Typography variant="body2" component="p" color="text.secondary" sx={{ mt: 1 }}>
            2025年法令準拠 / 簡易判定
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          p: { xs: 2, sm: 4 },
          maxWidth: '600px',
          mx: 'auto',
          width: '100%'
        }}>
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
            <Box sx={{ 
              textAlign: 'center', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '65vh',
              py: 3
            }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, fontSize: { xs: '1.8rem', sm: '2.5rem' } }}>
                  税金も社会保険も<br />払わずに済む<br />上限額をチェック
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setCurrentStep(1)}
                  sx={{ 
                    py: 2.5, 
                    px: 6, 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    mb: 4,
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    },
                    transition: 'all 0.3s ease'
                  }}
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
            </Box>
          )}

          {/* ステップ 1: 年齢選択 */}
          {currentStep === 1 && (() => {
            const options = [
              { key: 'under20', label: '19歳以下', value: 18 },
              { key: '20to22', label: '20〜22歳', value: 21 },
              { key: '23to25', label: '23〜25歳', value: 24 },
              { key: 'over26', label: '26歳以上', value: 26 }
            ];
            
            return (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                  あなたの年齢を選択してください
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {options.map((option, index) => (
                    <Button
                      key={option.key}
                      variant={step1SelectedIndex === index ? "contained" : "outlined"}
                      onClick={() => {
                        setStep1SelectedIndex(index);
                        setDependencyStatus({ ...dependencyStatus, age: option.value });
                        setTimeout(() => setCurrentStep(2), 300);
                      }}
                      sx={{ py: 2, fontSize: '1.1rem' }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            );
          })()}

          {/* ステップ 2: 職業セレクト */}
          {currentStep === 2 && (() => {
            const options = [
              { key: 'highschool', label: '高校生', isStudent: true },
              { key: 'university', label: '大学生・大学院生', isStudent: true },
              { key: 'worker', label: '社会人（正社員・契約社員）', isStudent: false },
              { key: 'freeter', label: 'フリーター・パート', isStudent: false }
            ];
            
            return (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                  あなたの職業を選択してください
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {options.map((option, index) => (
                    <Button
                      key={option.key}
                      variant={step1SelectedIndex === index ? "contained" : "outlined"}
                      onClick={() => {
                        setStep1SelectedIndex(index);
                        setDependencyStatus({
                          ...dependencyStatus,
                          occupation: option.key,
                          isStudent: option.isStudent
                        });
                        // 大学生を選んだ場合は三人兄弟質問へ、それ以外は収入区分へ
                        const nextStep = option.key === 'university' ? 3 : 4;
                        setTimeout(() => setCurrentStep(nextStep), 300);
                      }}
                      sx={{ py: 2, fontSize: '1.1rem' }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            );
          })()}

          {/* ステップ 3: 三人以上兄弟チェック（大学生のみ） */}
          {currentStep === 3 && dependencyStatus.occupation === 'university' && (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                三人以上兄弟がいますか？
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px', width: '100%' }}>
                <Button
                  variant={dependencyStatus.hasThreeSiblings === true ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ 
                      ...dependencyStatus, 
                      hasThreeSiblings: true,
                      manualLimit: 123,
                      combinedLimitJPY: 1230000
                    });
                    setTimeout(() => setCurrentStep(4), 300);
                  }}
                  sx={{ py: 2, fontSize: '1.1rem' }}
                >
                  はい（三人以上兄弟がいます）
                </Button>
                <Button
                  variant={dependencyStatus.hasThreeSiblings === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ 
                      ...dependencyStatus, 
                      hasThreeSiblings: false
                    });
                    setTimeout(() => setCurrentStep(4), 300);
                  }}
                  sx={{ py: 2, fontSize: '1.1rem' }}
                >
                  いいえ（三人兄弟はいません）
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 4: 収入区分チェック */}
          {currentStep === 4 && (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                今年の収入について教えてください
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px', width: '100%' }}>
                <Button
                  variant={dependencyStatus.salaryOnly === true ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, salaryOnly: true });
                    setTimeout(() => setCurrentStep(5), 300);
                  }}
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="button" sx={{ fontSize: '1.1rem' }}>
                      給与収入のみ
                    </Typography>
                    <Typography variant="caption" display="block">
                      (アルバイト・パート)
                    </Typography>
                  </Box>
                </Button>
                <Button
                  variant={dependencyStatus.salaryOnly === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, salaryOnly: false });
                  }}
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="button" sx={{ fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                      その他の収入もある
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ whiteSpace: 'nowrap' }}>
                      (事業・投資など)
                    </Typography>
                  </Box>
                </Button>
              </Box>
              {dependencyStatus.salaryOnly === false && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2" color="warning.dark">
                      申し訳ございません。給与収入以外がある場合は、今回の簡易チェックの対象外です。
                      詳細は税務署または税理士にご相談ください。
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        // その他収入がある場合は扶養設定をスキップして画面を閉じる
                        setDependencySetupOpen(false);
                        localStorage.setItem('dependencySetupDeferred', 'true');
                      }}
                      sx={{ mt: 1 }}
                    >
                      このまま進む
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* ステップ 5: 被扶養（家族の健保） */}
          {currentStep === 5 && dependencyStatus.salaryOnly && (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                あなたの健康保険の入り方は？
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px', width: '100%' }}>
                <Button
                  variant={dependencyStatus.hasDependent === true ? "contained" : "outlined"}
                  onClick={() => {
                    const isStu = dependencyStatus.isStudent === true;
                    setDependencyStatus({ ...dependencyStatus, hasDependent: true });
                    setTimeout(() => setCurrentStep(isStu ? 7 : 6), 300);
                  }}
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="button" sx={{ fontSize: '1.1rem' }}>
                      家族の扶養に入っている
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem' }}>
                      (学生の多くはこちら)
                    </Typography>
                  </Box>
                </Button>
                <Button
                  variant={dependencyStatus.hasDependent === false ? "contained" : "outlined"}
                  onClick={() => {
                    const isStu = dependencyStatus.isStudent === true;
                    setDependencyStatus({ ...dependencyStatus, hasDependent: false });
                    setTimeout(() => setCurrentStep(isStu ? 7 : 6), 300);
                  }}
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography variant="button" sx={{ fontSize: '1.1rem' }}>
                      自分で加入
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 6: 106万円の要件まとめ */}
          {currentStep === 6 && dependencyStatus.salaryOnly && (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center' }}>
                次の“すべて”に当てはまりますか？
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', lineHeight: 1.6 }}>
                週20h以上・雇用2か月超・従業員51人以上（任意特定含む）・月額8.8万円以上。<br />
                学生は原則対象外（休学・夜間・通信・卒後継続は対象になり得る）。
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px', width: '100%' }}>
                <Button
                  variant={dependencyStatus.meets106 === true ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, meets106: true });
                    setTimeout(() => setCurrentStep(7), 300);
                  }}
                  sx={{ py: 2, fontSize: '1.1rem' }}
                >
                  はい（全てに該当）
                </Button>
                <Button
                  variant={dependencyStatus.meets106 === false ? "contained" : "outlined"}
                  onClick={() => {
                    setDependencyStatus({ ...dependencyStatus, meets106: false });
                    setTimeout(() => setCurrentStep(7), 300);
                  }}
                  sx={{ py: 2, fontSize: '1.1rem' }}
                >
                  いいえ（どれか満たさない）
                </Button>
              </Box>
            </Box>
          )}

          {/* ステップ 7: 結果表示（税金0 & 社保0の同時上限） */}
          {currentStep === 7 && (
            <Box sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1.1rem' }}>
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
                // 三人以上兄弟の大学生は123万円の特別上限を適用
                const hero = dependencyStatus.hasThreeSiblings ? 1230000 : combined.capJPY;
                return (
                  <>
                    <Box sx={{ p: 2.5, bgcolor: 'primary.lighter', borderRadius: 3, mb: 1.5 }}>
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                        {hero !== null ? `¥${hero.toLocaleString()}` : '—'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
                      税金ゼロと社会保険ゼロを同時に満たすための上限です。
                    </Typography>
                    <Box sx={{ textAlign: 'left', mx: 'auto', maxWidth: 380, mb: 1 }}>
                      {combined.reasons.slice(0, 2).map((r, i) => (
                        <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                          ・{r}
                        </Typography>
                      ))}
                      {dependencyStatus.hasThreeSiblings && (
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 600, mt: 0.5, fontSize: '0.8rem' }}>
                          ・三人兄弟大学無償化の上限は123万円
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                          if (hero != null) {
                            const newStatus = { ...dependencyStatus, combinedLimitJPY: hero };
                            saveDependencyStatus(newStatus);
                          }
                        }}
                        sx={{ 
                          py: 1.5, 
                          px: 4, 
                          fontSize: '1.1rem', 
                          fontWeight: 600,
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                          },
                          transition: 'all 0.3s ease'
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
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          py: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            扶養上限を設定
          </Typography>
          <Typography variant="body2" component="p" color="text.secondary" sx={{ mt: 1 }}>
            現在の設定: ¥{Number(dependencyStatus.combinedLimitJPY || 1300000).toLocaleString()}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          p: { xs: 3, sm: 4 },
          maxWidth: '600px',
          mx: 'auto',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* 扶養を再チェック */}
            <Card sx={{ p: 3, bgcolor: '#e3f2fd', border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                扶養を再チェック
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                質問に答えて最適な上限額を自動計算します
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setCurrentStep(0);
                  setDependencyRecheckOpen(false);
                  setDependencySetupOpen(true);
                }}
                sx={{ py: 1.5 }}
              >
                再チェックを開始
              </Button>
            </Card>

            {/* 手動で上限額を設定 */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                手動で上限額を設定
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                自分で上限額を直接入力できます
              </Typography>
              
              <TextField
                fullWidth
                type="number"
                label="上限額"
                value={customZeroCap || dependencyStatus.combinedLimitJPY || 1300000}
                onChange={(e) => setCustomZeroCap(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                  endAdornment: <Typography sx={{ ml: 1 }}>円</Typography>,
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {[
                  { value: 1030000, label: '103万円' },
                  { value: 1230000, label: '123万円' },
                  { value: 1300000, label: '130万円' },
                  { value: 1500000, label: '150万円' }
                ].map(option => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => setCustomZeroCap(String(option.value))}
                    color={Number(customZeroCap) === option.value ? 'primary' : 'default'}
                    variant={Number(customZeroCap) === option.value ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                入力した額は「税金・社保の自動チェックは行いません」。保存される際は「税金・社保の同時上限」として扱われます。
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  const newStatus = {
                    ...dependencyStatus,
                    combinedLimitJPY: Number(customZeroCap) || 1300000,
                    manualLimit: Math.floor((Number(customZeroCap) || 1300000) / 10000)
                  };
                  saveDependencyStatus(newStatus);
                  setDependencyRecheckOpen(false);
                }}
                sx={{ py: 1.5 }}
                disabled={!customZeroCap}
              >
                この金額で設定
              </Button>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDependencyRecheckOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* 銀行連携ダイアログ - 非表示 */}
      {false && (
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
      )}

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

      {/* 初回給料タブ表示時の結果表示 */}
      <Dialog
        open={firstTimeResultsOpen}
        onClose={handleFirstTimeResultsClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          py: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' }, whiteSpace: 'nowrap' }}>
            扶養チェック結果
          </Typography>
          <Typography variant="body2" component="p" color="text.secondary" sx={{ mt: 1 }}>
            あなたの上限が確定しました
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          p: { xs: 2, sm: 4 },
          maxWidth: '600px',
          mx: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1.1rem' }}>
              あなたの「税金0 & 社保0」の同時上限
            </Typography>
            
            <Box sx={{ p: 2.5, bgcolor: 'primary.lighter', borderRadius: 3, mb: 1.5 }}>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                ¥{dependencyStatus.combinedLimitJPY ? dependencyStatus.combinedLimitJPY.toLocaleString() : '---'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
              税金ゼロと社会保険ゼロを同時に満たすための上限です。
            </Typography>
            
            {dependencyStatus.hasThreeSiblings && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'success.lighter', borderRadius: 2 }}>
                <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
                  ✓ 三人兄弟大学無償化の特別控除が適用されました
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              size="large"
              onClick={handleFirstTimeResultsClose}
              sx={{ 
                py: 1.5, 
                px: 4, 
                fontSize: '1.1rem', 
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease',
                mt: 2
              }}
            >
              給料管理を始める
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 新しい扶養チェックダイアログ */}
      <FuyouCheckDialog
        open={fuyouCheckOpen}
        onClose={() => setFuyouCheckOpen(false)}
        isFirstTime={false}
      />

    </Box>
  );
};
