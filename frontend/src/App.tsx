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
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // ナビゲーション状態管理
  const [currentTab, setCurrentTab] = useState<NavigationTab>('shifts');
  const [shifts, setShifts] = useState<Shift[]>([]);

  // デモ用の職場とシフト（API未接続でもカレンダーUIを確認できるように）
  const workplaces: Workplace[] = [
    {
      id: 'wp-1',
      userId: 'demo-user',
      name: 'カフェ A',
      hourlyRate: 1000,
      color: '#2196f3',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'wp-2',
      userId: 'demo-user',
      name: 'コンビニ B',
      hourlyRate: 950,
      color: '#4caf50',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const initialShifts: Shift[] = [
    {
      id: 'demo-1',
      userId: 'demo-user',
      jobSourceId: 'wp-1',
      jobSourceName: 'カフェ A',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 1000,
      breakMinutes: 60,
      workingHours: 7,
      calculatedEarnings: 7000,
      isConfirmed: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-2',
      userId: 'demo-user',
      jobSourceId: 'wp-2',
      jobSourceName: 'コンビニ B',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
      startTime: '18:00',
      endTime: '22:00',
      hourlyRate: 950,
      breakMinutes: 0,
      workingHours: 4,
      calculatedEarnings: 3800,
      isConfirmed: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

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
        }}
      >
        {/* トップナビゲーション（PC・タブレット） */}
        <Box sx={{ p: 2, pt: { xs: 1, sm: 2 } }}>
          <TopNavigation
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />

          {/* メインコンテンツ */}
          <Box sx={{ mt: { xs: 1, sm: 0 } }}>{renderContent()}</Box>
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
