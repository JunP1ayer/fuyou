// 📱 シフトボード風タブナビゲーション

import React from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery, Paper } from '@mui/material';
import {
  CalendarMonth,
  SmartToy,
  AttachMoney,
  Business,
  Settings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type TabValue = 'shift' | 'salary' | 'submit' | 'other' | 'settings';

interface ShiftboardTabsProps {
  currentTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabConfig = [
  { value: 'shift' as TabValue, label: 'シフト', icon: CalendarMonth },
  { value: 'salary' as TabValue, label: '給料管理', icon: AttachMoney },
  { value: 'submit' as TabValue, label: 'AI提出', icon: SmartToy },
  { value: 'other' as TabValue, label: 'バイト先', icon: Business },
  { value: 'settings' as TabValue, label: '設定', icon: Settings },
];

export const ShiftboardTabs: React.FC<ShiftboardTabsProps> = ({
  currentTab,
  onTabChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    onTabChange(newValue);
  };

  const tabStyles = {
    minHeight: isMobile ? 60 : 48,
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    color: 'text.secondary',
    '&.Mui-selected': {
      color: 'primary.main',
      fontWeight: 700,
    },
    '& .MuiTab-iconWrapper': {
      marginBottom: isMobile ? 0.5 : 0.25,
    },
  };

  return (
    <Paper
      elevation={3}
      component={motion.div}
      initial={{ opacity: 0, y: isMobile ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'fixed',
        ...(isMobile
          ? {
              // モバイル: 下部に配置
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              borderRadius: '16px 16px 0 0',
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
            }
          : {
              // デスクトップ: 上部に配置
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              borderRadius: 0,
              backgroundColor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }),
      }}
    >
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          minHeight: isMobile ? 60 : 48,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            ...(isMobile && {
              top: 0, // モバイルでは上に配置
              borderRadius: '0 0 3px 3px',
            }),
          },
          '& .MuiTabs-flexContainer': {
            height: isMobile ? 60 : 48,
          },
        }}
      >
        {tabConfig.map(tab => {
          const IconComponent = tab.icon;
          return (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={<IconComponent />}
              iconPosition={isMobile ? 'top' : 'start'}
              sx={tabStyles}
              component={motion.div}
              whileTap={{ scale: 0.95 }}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};
