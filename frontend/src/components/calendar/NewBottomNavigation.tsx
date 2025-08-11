// 新しい下部ナビゲーション（5つのUI）

import React from 'react';
import {
  Box,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CalendarMonth,
  AttachMoney,
  Business,
  Share,
  Add,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCalendarStore } from '../../store/calendarStore';

export type NewTabValue = 'shift' | 'salary' | 'workplace' | 'share';

interface NewBottomNavigationProps {
  currentTab: NewTabValue;
  onTabChange: (tab: NewTabValue) => void;
  onAddClick: () => void;
}

export const NewBottomNavigation: React.FC<NewBottomNavigationProps> = ({
  currentTab,
  onTabChange,
  onAddClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { openEventDialog } = useCalendarStore();

  const handleTabChange = (event: React.SyntheticEvent, newValue: NewTabValue) => {
    onTabChange(newValue);
  };

  const handleAddClick = () => {
    // 今日の日付で予定追加ダイアログを開く
    const today = new Date().toISOString().split('T')[0];
    openEventDialog(today);
    onAddClick();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 1,
        px: 2,
        minHeight: 60,
        position: 'relative',
      }}
    >
      {/* シフト */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'shift' ? 'primary.main' : 'text.secondary',
        }}
        onClick={() => onTabChange('shift')}
      >
        <CalendarMonth />
        <Box sx={{ fontSize: 12, mt: 0.5 }}>シフト</Box>
      </Box>

      {/* 給料 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'salary' ? 'primary.main' : 'text.secondary',
        }}
        onClick={() => onTabChange('salary')}
      >
        <AttachMoney />
        <Box sx={{ fontSize: 12, mt: 0.5 }}>給料</Box>
      </Box>

      {/* 中央の追加ボタン */}
      <Fab
        color="primary"
        size="medium"
        onClick={handleAddClick}
        sx={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          boxShadow: '0 4px 12px rgba(67, 233, 123, 0.4)',
        }}
      >
        <Add />
      </Fab>

      {/* バイト先 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'workplace' ? 'primary.main' : 'text.secondary',
        }}
        onClick={() => onTabChange('workplace')}
      >
        <Business />
        <Box sx={{ fontSize: 12, mt: 0.5 }}>バイト先</Box>
      </Box>

      {/* 共有 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'share' ? 'primary.main' : 'text.secondary',
        }}
        onClick={() => onTabChange('share')}
      >
        <Share />
        <Box sx={{ fontSize: 12, mt: 0.5 }}>共有</Box>
      </Box>
    </Box>
  );
};