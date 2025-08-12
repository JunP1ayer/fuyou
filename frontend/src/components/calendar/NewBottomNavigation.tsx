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
  AutoAwesome,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCalendarStore } from '../../store/calendarStore';
import { useI18n } from '@/hooks/useI18n';

export type NewTabValue = 'shift' | 'salary' | 'workplace' | 'share';

interface NewBottomNavigationProps {
  currentTab: NewTabValue;
  onTabChange: (tab: NewTabValue) => void;
  onAIClick: () => void;
}

export const NewBottomNavigation: React.FC<NewBottomNavigationProps> = ({
  currentTab,
  onTabChange,
  onAIClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { openEventDialog } = useCalendarStore();
  const { t } = useI18n();

  const handleTabChange = (event: React.SyntheticEvent, newValue: NewTabValue) => {
    onTabChange(newValue);
  };

  const handleAIClick = () => {
    // シフト提出画面に遷移
    onAIClick();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
          flex: 1,
        }}
        onClick={() => onTabChange('shift')}
      >
        <CalendarMonth />
          <Box sx={{ fontSize: 12, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.calendar','カレンダー')}
          </Box>
      </Box>

      {/* 給料 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'salary' ? 'primary.main' : 'text.secondary',
          flex: 1,
        }}
        onClick={() => onTabChange('salary')}
      >
        <AttachMoney />
          <Box sx={{ fontSize: 12, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.salary','給料')}
          </Box>
      </Box>


      {/* バイト先 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'workplace' ? 'primary.main' : 'text.secondary',
          flex: 1,
        }}
        onClick={() => onTabChange('workplace')}
      >
        <Business />
          <Box sx={{ fontSize: 12, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.workplace','管理')}
          </Box>
      </Box>

      {/* 共有 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'share' ? 'primary.main' : 'text.secondary',
          flex: 1,
        }}
        onClick={() => onTabChange('share')}
      >
        <Share />
          <Box sx={{ fontSize: 12, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.share','共有')}
          </Box>
      </Box>
    </Box>
  );
};