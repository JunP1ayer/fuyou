// 📱 シフトボード風タブナビゲーション

import React from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery, Paper } from '@mui/material';
import {
  CalendarMonth,
  Share,
  AttachMoney,
  Business,
  Add,
  AccountBalance,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type TabValue = 'shift' | 'salary' | 'submit' | 'other';

interface ShiftboardTabsProps {
  currentTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  renderContent: () => React.ReactNode;
  jobHubView?: string;
  setJobHubView?: (view: string) => void;
}

const tabConfig = [
  { value: 'shift' as TabValue, label: 'シフト', icon: CalendarMonth },
  { value: 'salary' as TabValue, label: '給料管理', icon: AttachMoney },
  { value: 'other' as TabValue, label: '友達のシフト共有', icon: Share },
  { value: 'submit' as TabValue, label: 'バイト管理', icon: Business },
];

export const ShiftboardTabs: React.FC<ShiftboardTabsProps> = ({
  currentTab,
  onTabChange,
  renderContent,
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* メインコンテンツエリア */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', // スクロール可能に変更
        marginBottom: '60px',
      }}>
        {renderContent()}
      </Box>

      {/* 下部タブナビゲーション */}
      <Paper
        elevation={3}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          borderRadius: '16px 16px 0 0',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around', // 4つを均等配置
            px: 0.5,
          }}
        >
          {tabConfig.map(tab => {
            const IconComponent = tab.icon;
            const isSelected = currentTab === tab.value;
            return (
              <Box
                key={tab.value}
                component={motion.div}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.value)}
                sx={{
                  flex: 1, // 各タブが均等な幅を占める
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  py: 1,
                  position: 'relative',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <IconComponent sx={{ 
                  fontSize: 20, 
                  mb: 0.5,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                }} />
                <Box sx={{ 
                  fontSize: '11px', 
                  fontWeight: isSelected ? 700 : 600,
                  textAlign: 'center',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  whiteSpace: 'nowrap', // 改行防止
                }}>
                  {tab.value === 'other' ? '友達のシフト共有' : tab.label}
                </Box>
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      height: 3,
                      borderRadius: '0 0 3px 3px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};
