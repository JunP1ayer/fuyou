// 🌟 フローティングアクションボタン

import React, { useState } from 'react';
import { 
  Fab, 
  Box, 
  useTheme, 
  alpha,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useMediaQuery,
} from '@mui/material';
import { 
  Add, 
  Work, 
  Person, 
  CalendarMonth, 
  TrendingUp,
  Close,
  Edit,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onAddShift: () => void;
  onAddPersonalEvent: () => void;
  onOpenCalendar: () => void;
  onOpenDashboard: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddShift,
  onAddPersonalEvent,
  onOpenCalendar,
  onOpenDashboard,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <Work />,
      name: 'シフト追加',
      onClick: onAddShift,
      color: '#FFD54F',
    },
    {
      icon: <Person />,
      name: '個人予定',
      onClick: onAddPersonalEvent,
      color: '#64B5F6',
    },
    {
      icon: <CalendarMonth />,
      name: 'カレンダー',
      onClick: onOpenCalendar,
      color: '#81C784',
    },
    {
      icon: <TrendingUp />,
      name: 'ダッシュボード',
      onClick: onOpenDashboard,
      color: '#F06292',
    },
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick();
    setOpen(false);
  };

  if (!isMobile) {
    return null; // PCでは表示しない
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80, // ボトムナビゲーションの上
        right: 16,
        zIndex: 1200,
      }}
    >
      <SpeedDial
        ariaLabel="クイックアクション"
        icon={<SpeedDialIcon icon={<Add />} openIcon={<Close />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
        sx={{
          '& .MuiSpeedDial-fab': {
            background: `linear-gradient(135deg, 
              ${theme.palette.primary.main} 0%, 
              ${theme.palette.secondary.main} 100%
            )`,
            color: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            '&:hover': {
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.dark} 0%, 
                ${theme.palette.secondary.dark} 100%
              )`,
              transform: 'scale(1.05)',
            },
          },
        }}
      >
        {actions.map((action, index) => (
          <SpeedDialAction
            key={action.name}
            icon={
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {action.icon}
                </Box>
              </motion.div>
            }
            tooltipTitle={action.name}
            onClick={() => handleActionClick(action)}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                backgroundColor: 'transparent',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* 背景オーバーレイ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: alpha(theme.palette.background.default, 0.8),
              backdropFilter: 'blur(4px)',
              zIndex: -1,
            }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* カスタムアニメーション効果 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `radial-gradient(circle, 
                ${alpha(theme.palette.primary.main, 0.2)} 0%,
                transparent 70%
              )`,
              transform: 'scale(3)',
              pointerEvents: 'none',
              zIndex: -2,
            }}
          />
        )}
      </AnimatePresence>
    </Box>
  );
};