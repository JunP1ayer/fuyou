// 🎯 FUYOU PRO - 美しいアプリヘッダー

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Settings,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import type { ThemeMode } from '@types/index';

interface AppHeaderProps {
  currentView: string;
  themeMode: ThemeMode;
  onThemeToggle: () => void;
}

const viewTitles = {
  calendar: '📅 シフトカレンダー',
  dashboard: '📊 収入ダッシュボード',
  add: '➕ シフト登録',
  settings: '⚙️ 設定',
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  themeMode,
  onThemeToggle,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        {/* ロゴ＆タイトル */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'white',
                fontSize: '1.5rem',
              }}
            >
              🔥
            </Typography>
          </motion.div>

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'white',
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
            >
              扶養カレンダー
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.common.white, 0.8),
                fontSize: '0.7rem',
                lineHeight: 1,
              }}
            >
              {viewTitles[currentView as keyof typeof viewTitles] ||
                '最強扶養管理'}
            </Typography>
          </Box>
        </Box>

        {/* アクションボタン */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 収入状況インジケーター（カレンダービューのみ） */}
          {currentView === 'calendar' && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                color="inherit"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                  },
                }}
              >
                <TrendingUp />
              </IconButton>
            </motion.div>
          )}

          {/* テーマ切り替え */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <IconButton
              color="inherit"
              onClick={onThemeToggle}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                },
              }}
            >
              {themeMode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </motion.div>

          {/* 設定（デスクトップのみ） */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                color="inherit"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                  },
                }}
              >
                <Settings />
              </IconButton>
            </motion.div>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
