import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { ShiftManager } from './components/shifts/ShiftManager';
import { TopNavigation } from './components/navigation/TopNavigation';
import {
  CustomBottomNavigation,
  type NavigationTab,
} from './components/navigation/BottomNavigation';
import { AIFeature } from './components/features/AIFeature';
import { FuyouStatusCard } from './components/FuyouStatusCard';
import { MonthlySalaryCard } from './components/MonthlySalaryCard';
import { OthersFeature } from './components/features/OthersFeature';
import type { Shift, Workplace, CreateShiftData } from './types/shift';

// Enhanced Material-UI theme configuration for better UX
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      '50': '#e8f5e8',
    },
    warning: {
      main: '#ff9800',
      '50': '#fff3e0',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const now = new Date();
  const _currentYear = now.getFullYear();
  const _currentMonth = now.getMonth();

  // ナビゲーション状態管理
  const [currentTab, setCurrentTab] = useState<NavigationTab>('shifts');
  const [shifts, setShifts] = useState<Shift[]>([]);

  const workplaces: Workplace[] = [];
  const initialShifts: Shift[] = [];

  // タブ変更ハンドラ
  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
  };

  // シフトデータ更新ハンドラ
  const handleShiftsChange = useCallback((newShifts: Shift[]) => {
    setShifts(newShifts);
  }, []);

  // AI機能からのシフト保存ハンドラ
  const handleAIShiftsSaved = useCallback((newShifts: CreateShiftData[]) => {
    // 実際の実装では、ここでAPIを呼び出してシフトを保存
    console.log('AI機能でシフトが保存されました:', newShifts);
  }, []);

  // コンテンツレンダリング
  const renderContent = () => {
    switch (currentTab) {
      case 'shifts':
        return (
          <ShiftManager
            workplaces={workplaces}
            initialShifts={initialShifts}
            showAddButton={true}
            onShiftsChange={handleShiftsChange}
          />
        );
      case 'ai':
        return <AIFeature onShiftsSaved={handleAIShiftsSaved} />;
      case 'salary':
        return (
          <Box>
            <FuyouStatusCard />
            <Box sx={{ mt: 2 }}>
              <MonthlySalaryCard
                shifts={shifts.length > 0 ? shifts : initialShifts}
              />
            </Box>
          </Box>
        );
      case 'others':
        return <OthersFeature />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          pb: { xs: 8, sm: 2 }, // スマホ版では下部ナビゲーションのためのスペースを確保
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        {/* 全体コンテナ */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '1200px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: { xs: 1, sm: 2 }, 
          pt: { xs: 1, sm: 2 },
          margin: '0 auto'
        }}>
          {/* トップナビゲーション（PC・タブレット） */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TopNavigation
              currentTab={currentTab}
              onTabChange={handleTabChange}
            />
          </Box>

          {/* メインコンテンツ */}
          <Box sx={{ 
            mt: { xs: 1, sm: 0 }, 
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {renderContent()}
          </Box>
        </Box>

        {/* ボトムナビゲーション（スマホ） */}
        <CustomBottomNavigation
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
