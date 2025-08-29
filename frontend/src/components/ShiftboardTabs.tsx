// 📱 シフトボード風タブナビゲーション

import React from 'react';
import { Box, useTheme, useMediaQuery, Paper, Dialog, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import {
  CalendarMonth,
  Share,
  AttachMoney,
  Business,
  Add,
  Close,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GPTShiftSubmitter } from './GPTShiftSubmitter';

export type TabValue = 'shift' | 'salary' | 'add' | 'submit' | 'other';

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
  { value: 'add' as TabValue, label: '', icon: Add },
  { value: 'submit' as TabValue, label: 'バイト管理', icon: Business },
  { value: 'other' as TabValue, label: 'シフト共有', icon: Share },
];

export const ShiftboardTabs: React.FC<ShiftboardTabsProps> = ({
  currentTab,
  onTabChange,
  renderContent,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openSubmit, setOpenSubmit] = React.useState(false);

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
        marginBottom: '0px', // マージンを削除
      }}>
        {renderContent()}
      </Box>

      {/* 下部タブナビゲーション - 非表示 */}
      {false && (
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
          pb: 0,
        }}
      >
        {/* Center FAB moved outside the bar to avoid overlap */}
        {/* (cradle removed; using 5-tab layout with plus as a tab) */}
        <Box
          sx={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 0.5,
          }}
        >
          {tabConfig.map((tab) => {
            const IconComponent = tab.icon as any;
            const isAdd = tab.value === 'add';
            const isSelected = !isAdd && currentTab === tab.value;
            return (
              <Box
                key={tab.value}
                component={motion.div}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isAdd) {
                    // open submit dialog (handled locally in this component)
                    setOpenSubmit(true);
                  } else {
                    onTabChange(tab.value);
                  }
                }}
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
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {isAdd ? (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.25,
                      background: 'linear-gradient(180deg, #5ac8fa 0%, #0fb5f0 100%)',
                      boxShadow: '0 6px 14px rgba(90,200,250,0.35)',
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  >
                    <Add sx={{ fontSize: 22, color: '#fff' }} />
                  </Box>
                ) : (
                  IconComponent && (
                    <IconComponent sx={{ 
                      fontSize: 20, 
                      mb: 0.5,
                      color: isSelected ? 'primary.main' : 'text.secondary',
                    }} />
                  )
                )}
                <Box sx={{ 
                  fontSize: '11px', 
                  fontWeight: isSelected ? 700 : 600,
                  textAlign: 'center',
                  color: isAdd ? 'transparent' : (isSelected ? 'primary.main' : 'text.secondary'),
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
                      background: 'linear-gradient(135deg, #5ac8fa 0%, #0fb5f0 100%)',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
      )}

      {/* Plus action is now a dedicated center tab; no floating FAB */}

      {/* Submit Dialog */}
      <Dialog fullScreen={isMobile} open={openSubmit} onClose={() => setOpenSubmit(false)}>
        <AppBar sx={{ position: 'relative' }} color="transparent" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setOpenSubmit(false)} aria-label="close">
              <Close />
            </IconButton>
            <Typography sx={{ ml: 1, flex: 1, fontWeight: 700 }} variant="subtitle1" component="div">
              シフト表を提出
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <GPTShiftSubmitter
            onNavigateToWorkplaces={() => {
              setOpenSubmit(false);
              onTabChange('submit'); // バイト管理タブへ誘導（職場登録用）
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};
