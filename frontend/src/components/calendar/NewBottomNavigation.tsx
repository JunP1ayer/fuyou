// 新しい下部ナビゲーション（5つのUI）

import React from 'react';
import {
  Box,
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
import { useI18n } from '@/hooks/useI18n';

export type NewTabValue = 'shift' | 'salary' | 'workplace' | 'share';

interface NewBottomNavigationProps {
  currentTab: NewTabValue;
  onTabChange: (tab: NewTabValue) => void;
  onAIClick: () => void;
  onScrollToToday?: () => void;
}

export const NewBottomNavigation: React.FC<NewBottomNavigationProps> = ({
  currentTab,
  onTabChange,
  onAIClick,
  onScrollToToday,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { openEventDialog } = useCalendarStore();
  const { t } = useI18n();

  const handleTabChange = (event: React.SyntheticEvent, newValue: NewTabValue) => {
    onTabChange(newValue);
  };

  const handleCalendarClick = () => {
    if (currentTab === 'shift' && onScrollToToday) {
      // 既にカレンダータブの場合は今日に戻る
      onScrollToToday();
    } else {
      // カレンダータブに切り替え
      onTabChange('shift');
    }
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
        py: 0.5,
        px: 2,
        minHeight: 48,
        position: 'relative',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
      >
      {/* シフト */}
      <Box
        component={motion.div}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'shift' ? 'primary.main' : 'text.secondary',
          flex: 1,
          borderRadius: 2,
          py: 0.25,
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: 36,
          '&:active': {
            backgroundColor: 'action.selected',
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleCalendarClick}
        onTouchStart={() => {}}
      >
        <CalendarMonth />
          <Box sx={{ fontSize: 10, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.shift','シフト')}
          </Box>
      </Box>

      {/* 給料 */}
      <Box
        component={motion.div}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'salary' ? 'primary.main' : 'text.secondary',
          flex: 1,
          borderRadius: 2,
          py: 0.25,
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: 36,
          '&:active': {
            backgroundColor: 'action.selected',
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => onTabChange('salary')}
        onTouchStart={() => {}}
      >
        <AttachMoney />
          <Box sx={{ fontSize: 10, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.salary','給料')}
          </Box>
      </Box>

      {/* プラスボタン（中央） */}
      <Box
        component={motion.div}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flex: 0.8,
          borderRadius: '50%',
          position: 'relative',
          minHeight: 36,
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={handleAIClick}
        onTouchStart={() => {}}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
            },
            '&:active': {
              backgroundColor: 'rgba(33, 150, 243, 0.3)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Add sx={{ color: '#2196F3', fontSize: 18 }} />
        </Box>
      </Box>

      {/* バイト管理 */}
      <Box
        component={motion.div}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'workplace' ? 'primary.main' : 'text.secondary',
          flex: 1,
          borderRadius: 2,
          py: 0.25,
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: 36,
          '&:active': {
            backgroundColor: 'action.selected',
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => onTabChange('workplace')}
        onTouchStart={() => {}}
      >
        <Business />
          <Box sx={{ fontSize: 10, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.management','管理')}
          </Box>
      </Box>

      {/* 共有 */}
      <Box
        component={motion.div}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          color: currentTab === 'share' ? 'primary.main' : 'text.secondary',
          flex: 1,
          borderRadius: 2,
          py: 0.25,
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: 36,
          '&:active': {
            backgroundColor: 'action.selected',
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => onTabChange('share')}
        onTouchStart={() => {}}
      >
        <Share />
          <Box sx={{ fontSize: 10, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {t('nav.share','共有')}
          </Box>
      </Box>
    </Box>
  );
};