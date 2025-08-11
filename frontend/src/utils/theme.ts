// 🎨 FUYOU PRO - 美しいテーマシステム

import { createTheme, ThemeOptions } from '@mui/material/styles';
import type { ThemeMode } from '@/types/index';

// カスタムカラーパレット
const colors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // メインブルー
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // メイングリーン
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107', // メインアンバー
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336', // メインレッド
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  background: {
    light: '#fafafa',
    dark: '#121212',
  },
  surface: {
    light: '#ffffff',
    dark: '#1e1e1e',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
  },
};

// 共通のテーマオプション
const getThemeOptions = (mode: ThemeMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
    },
    success: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
    },
    background: {
      default:
        mode === 'light' ? colors.background.light : colors.background.dark,
      paper: mode === 'light' ? colors.surface.light : colors.surface.dark,
    },
    ...(mode === 'dark' && {
      background: {
        default: colors.background.dark,
        paper: colors.surface.dark,
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    }),
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Noto Sans JP"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          background: colors.gradient.primary,
          '&:hover': {
            background: colors.gradient.primary,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            mode === 'light'
              ? '0 2px 12px rgba(0,0,0,0.08)'
              : '0 2px 12px rgba(255,255,255,0.05)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.2s ease-in-out',
            boxShadow:
              mode === 'light'
                ? '0 8px 24px rgba(0,0,0,0.12)'
                : '0 8px 24px rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow:
            mode === 'light'
              ? '0 1px 3px rgba(0,0,0,0.08)'
              : '0 1px 3px rgba(255,255,255,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[500],
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: colors.gradient.primary,
          color: 'white',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export const createAppTheme = (mode: ThemeMode = 'light') => {
  return createTheme(getThemeOptions(mode));
};

// エクスポート用の色定数
export { colors };

// カスタムアニメーション用の設定
export const animations = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  smooth: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
  bounce: {
    type: 'spring',
    bounce: 0.4,
    duration: 0.8,
  },
};
