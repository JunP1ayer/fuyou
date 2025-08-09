import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  SmartToy as SmartToyIcon,
  Calculate as CalculateIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';

export type NavigationTab = 'shifts' | 'ai' | 'salary' | 'others';

interface CustomBottomNavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const CustomBottomNavigation: React.FC<CustomBottomNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) return null; // スマホ版のみ表示

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
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentTab}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            px: 1,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            mt: 0.5,
          },
        }}
      >
        {tabs.map(tab => (
          <BottomNavigationAction
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={tab.icon}
            sx={{
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.3rem',
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};
