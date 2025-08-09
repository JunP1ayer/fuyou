import React from 'react';
import { Tabs, Tab, Paper, Box, useTheme, useMediaQuery } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  SmartToy as SmartToyIcon,
  Calculate as CalculateIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';

export type NavigationTab = 'shifts' | 'ai' | 'salary' | 'others';

interface TopNavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) return null; // PC・タブレット版のみ表示

  const tabs: {
    value: NavigationTab;
    label: string;
    icon: React.ReactElement;
  }[] = [
    { value: 'shifts', label: 'シフト', icon: <ScheduleIcon /> },
    { value: 'ai', label: 'シフト提出', icon: <SmartToyIcon /> },
    { value: 'salary', label: '給料計算', icon: <CalculateIcon /> },
    { value: 'others', label: 'その他', icon: <MoreHorizIcon /> },
  ];

  const handleChange = (_: React.SyntheticEvent, newValue: NavigationTab) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      mb: 2,
      px: 2
    }}>
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
      <Box sx={{ px: 2, py: 1 }}>
        <Tabs
          value={currentTab}
          onChange={handleChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderRadius: 1,
              },
              '&.Mui-selected': {
                fontWeight: 600,
                color: 'primary.main',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 1.5,
            },
          }}
        >
          {tabs.map(tab => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.2rem',
                  mr: 0.5,
                },
              }}
            />
          ))}
        </Tabs>
      </Box>
    </Paper>
    </Box>
  );
};
