// 🧭 FUYOU PRO - 美しいボトムナビゲーション

import React from 'react';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  alpha,
  Box,
} from '@mui/material';
import { CalendarMonth, TrendingUp, Add, Settings } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

type ViewType = 'calendar' | 'dashboard' | 'add' | 'settings';

interface BottomNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onViewChange,
}) => {
  const theme = useTheme();

  const navigationItems = [
    {
      label: 'カレンダー',
      value: 'calendar' as ViewType,
      icon: CalendarMonth,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      label: 'ダッシュボード',
      value: 'dashboard' as ViewType,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      label: '追加',
      value: 'add' as ViewType,
      icon: Add,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      special: true, // 特別なスタイル
    },
    {
      label: '設定',
      value: 'settings' as ViewType,
      icon: Settings,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' }, // モバイルのみ表示
        background:
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <MuiBottomNavigation
        value={currentView}
        onChange={(_, newValue) => onViewChange(newValue)}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.text.secondary,
            minWidth: 'auto',
            padding: '8px 12px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isSelected = currentView === item.value;
          const isSpecial = item.special;

          return (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                <Box sx={{ position: 'relative' }}>
                  {/* 選択時の背景 */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          right: -8,
                          bottom: -8,
                          background: item.gradient,
                          borderRadius: isSpecial ? '50%' : 12,
                          zIndex: -1,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* 特別なアイコン（追加ボタン） */}
                  {isSpecial ? (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: item.gradient,
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      <Icon
                        sx={{
                          color: 'white',
                          fontSize: 28,
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon
                        sx={{
                          color: isSelected ? 'white' : 'inherit',
                          fontSize: 24,
                          transition: 'color 0.2s ease-in-out',
                        }}
                      />
                    </motion.div>
                  )}

                  {/* 選択時のドット */}
                  <AnimatePresence>
                    {isSelected && !isSpecial && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 8,
                          height: 8,
                          background: 'white',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Box>
              }
              sx={{
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: isSelected ? theme.palette.primary.main : 'inherit',
                  mt: 0.5,
                },
              }}
            />
          );
        })}
      </MuiBottomNavigation>
    </Paper>
  );
};
