// 扶養カレンダー - 最強扶養管理アプリ

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
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthGuard, ProtectedRoute } from './components/auth/AuthGuard';
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
        return <MobileSalaryView />;
      case 'submit':
        // 統合バイト管理（AI提出 + ワークプレース管理）
        switch (jobHubView) {
          case 'hub':
            return (
              <JobManagementHub
                onNavigateToWorkplaceManager={() => setJobHubView('workplace')}
                onNavigateToAISubmission={() => setJobHubView('ai')}
              />
            );
          case 'workplace':
            return <WorkplaceManager />;
          case 'ai':
            return (
              <GPTShiftSubmitter
                onNavigateToWorkplaces={() => setJobHubView('workplace')}
              />
            );
          case 'friends':
            return (
              <FriendSharingHub
                onBack={() => setJobHubView('hub')}
              />
            );
          default:
            return null;
        }
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
          <AuthProvider>
            <ToastProvider>
            <CssBaseline />

            <Container
              maxWidth="lg"
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
                <AuthGuard>
                  <Routes>
                    <Route path="/" element={
                      <ProtectedRoute>
                        <ShiftboardTabs
                          currentTab={currentTab}
                          onTabChange={handleTabChange}
                          renderContent={renderContent}
                          jobHubView={jobHubView}
                          setJobHubView={(view: string) => setJobHubView(view as 'hub' | 'workplace' | 'ai' | 'friends')}
                        />
                      </ProtectedRoute>
                    } />
                    <Route path="/wizard" element={<ProtectedRoute><WizardStart /></ProtectedRoute>} />
                    <Route path="/wizard/steps" element={<ProtectedRoute><WizardSteps /></ProtectedRoute>} />
                    <Route path="/wizard/result" element={<ProtectedRoute><WizardResult /></ProtectedRoute>} />
                    <Route path="/submit" element={<ProtectedRoute><GPTShiftSubmitter /></ProtectedRoute>} />
                    <Route path="/legal" element={<LegalPage />} />
                  </Routes>
                </AuthGuard>
              </Box>
            </Container>

            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
