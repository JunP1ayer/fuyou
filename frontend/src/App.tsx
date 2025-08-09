import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { TabbedShiftApp } from './components/TabbedShiftApp';

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TabbedShiftApp />
    </ThemeProvider>
  );
}

export default App;
