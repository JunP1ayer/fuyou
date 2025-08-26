// 扶養カレンダー - 最強扶養管理アプリ

// 本番環境初期化ログ
console.log('🚀 App.tsx loading:', {
  timestamp: new Date().toISOString(),
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
});

import React, { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  createTheme,
  Card,
  CardContent,
  Grid,
  Button,
  Container,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { responsiveFontSizes } from '@mui/material/styles';

// コンポーネントとストアをインポート
import { useTestStore } from './store/testStore';
import { useSimpleShiftStore } from './store/simpleShiftStore';
import { SimpleCalendarView } from './components/SimpleCalendarView';
import { ToastProvider } from './components/Toast/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SimpleAppContent } from './components/SimpleAppContent';
import { SafeCalendarView } from './components/SafeCalendarView';
import { ShiftboardTabs, type TabValue } from './components/ShiftboardTabs';
import { WizardStart } from './components/wizard/WizardStart';
import { WizardSteps } from './components/wizard/WizardSteps';
import { WizardResult } from './components/wizard/WizardResult';
import { GPTShiftSubmitter } from './components/GPTShiftSubmitter';
import { WorkplaceManager } from './components/WorkplaceManager';
import { JobManagementHub } from './components/JobManagementHub';
import { FriendSharingHub } from './components/FriendSharingHub';
import LegalPage from './pages/Legal';
import { ShiftboardSalaryManager } from './components/ShiftboardSalaryManager';
import { MobileSalaryView } from './components/salary/MobileSalaryView';
import { preloadCountryRules } from './lib/rules/provider';
import { ToastDemo } from './components/Toast/ToastDemo';
import { CalendarApp } from './components/calendar/CalendarApp';
import { GPT5Assistant } from './components/GPT5Assistant';

const theme = responsiveFontSizes(createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5ac8fa', // iOSの水色系に近い
      light: '#aee6ff',
      dark: '#0fb5f0',
    },
    background: {
      default: '#f7fbfe', // ごく薄い水色ベース
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
      },
    },
  },
}));

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState<TabValue>('shift');
  const [jobHubView, setJobHubView] = useState<'hub' | 'workplace' | 'ai' | 'friends'>('hub');
  const [hasSalaryTabBeenClicked, setHasSalaryTabBeenClicked] = useState(false);
  const { shiftsCount, totalEarnings, incrementShifts, addEarnings } =
    useTestStore();
  const { shifts, getTotalEarnings } = useSimpleShiftStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // 国別ルールのプリロード（起動時）
  React.useEffect(() => {
    preloadCountryRules();
  }, []);


  // タブ切り替え時にルートパスに戻る
  const handleTabChange = (tab: TabValue) => {
    setCurrentTab(tab);
    // 給料タブが初めてクリックされたことを記録
    if (tab === 'salary' && !hasSalaryTabBeenClicked) {
      setHasSalaryTabBeenClicked(true);
    }
    // バイト管理のサブビューをリセット（submitタブ以外）
    if (tab !== 'submit') {
      setJobHubView('hub');
    }
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'shift':
        // カレンダー機能を表示
        return <CalendarApp 
          onNavigateToWorkplaceManager={() => {
            setCurrentTab('submit');
            setJobHubView('workplace');
          }}
        />;
      case 'salary':
        return <MobileSalaryView 
          showFirstTimeResults={hasSalaryTabBeenClicked && currentTab === 'salary'}
        />;
      case 'submit':
        // 統合バイト管理（タブ切り替えで両機能を提供）
        return <JobManagementHub />;
      case 'other':
        // 予定共有機能
        return (
          <FriendSharingHub
            onBack={() => setCurrentTab('shift')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <LanguageProvider>
          <SimpleAuthProvider>
            <ToastProvider>
            <CssBaseline />

            <SimpleAppContent>
              <Container
                maxWidth={false}
                disableGutters
                sx={{
                  py: 0, // パディングを削除
                  pt: 0, // 上部パディングを削除
                  pb: 0, // 下部パディングを削除
                  height: '100vh', // 100dvh から 100vh に変更
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* ヘッダー削除（スペースを節約） */}

                {/* メインコンテンツ（スクロール） */}
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <Routes>
                    <Route path="/" element={
                      <ShiftboardTabs
                        currentTab={currentTab}
                        onTabChange={handleTabChange}
                        renderContent={renderContent}
                        jobHubView={jobHubView}
                        setJobHubView={(view: string) => setJobHubView(view as 'hub' | 'workplace' | 'ai' | 'friends')}
                      />
                    } />
                    <Route path="/wizard" element={<WizardStart />} />
                    <Route path="/wizard/steps" element={<WizardSteps />} />
                    <Route path="/wizard/result" element={<WizardResult />} />
                    <Route path="/submit" element={<GPTShiftSubmitter />} />
                    <Route path="/legal" element={<LegalPage />} />
                  </Routes>
                </Box>
              </Container>
            </SimpleAppContent>

            </ToastProvider>
          </SimpleAuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
