import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { ShiftManager } from './components/shifts/ShiftManager';
import type { Shift, Workplace } from './types/shift';

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

  // デモ用の職場とシフト（API未接続でもカレンダーUIを確認できるように）
  const workplaces: Workplace[] = [
    { id: 'wp-1', userId: 'demo-user', name: 'カフェ A', hourlyRate: 1000, color: '#2196f3', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'wp-2', userId: 'demo-user', name: 'コンビニ B', hourlyRate: 950, color: '#4caf50', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
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
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <ShiftManager
          workplaces={workplaces}
          initialShifts={initialShifts}
          showAddButton={true}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
