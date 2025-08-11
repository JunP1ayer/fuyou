// 下部ナビゲーションコンポーネント

import React, { useState } from 'react';
import {
  Box,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CalendarMonth,
  AttachMoney,
  Business,
  Add,
  Close,
  ViewWeek,
  ViewDay,
  ViewList,
  Event,
} from '@mui/icons-material';
import { useCalendarStore } from '../../store/calendarStore';
import { useI18n } from '@/hooks/useI18n';
import type { BottomNavTab, CalendarViewMode } from '../../types/calendar';

interface BottomNavigationProps {
  onShiftClick: () => void;
  onSalaryClick: () => void;
  onWorkplaceClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onShiftClick,
  onSalaryClick,
  onWorkplaceClick,
}) => {
  const { selectedTab, setSelectedTab, viewMode, setViewMode, openEventDialog } = useCalendarStore();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t } = useI18n();

  // タブ切り替え処理
  const handleTabChange = (event: React.SyntheticEvent, newValue: BottomNavTab) => {
    if (newValue === 'add') {
      // ＋ボタンクリック時はメニューを表示
      setAnchorEl(event.currentTarget as HTMLElement);
      return;
    }
    
    setSelectedTab(newValue);
    
    switch (newValue) {
      case 'shift':
        onShiftClick();
        break;
      case 'salary':
        onSalaryClick();
        break;
      case 'workplace':
        onWorkplaceClick();
        break;
    }
  };

  // SpeedDial アクション
  const speedDialActions = [
    { 
      icon: <Event />, 
      name: t('calendar.event.newTitle', '新しい予定を追加'),
      onClick: () => {
        const today = new Date().toISOString().split('T')[0];
        openEventDialog(today);
        setSpeedDialOpen(false);
      }
    },
    { 
      icon: <CalendarMonth />, 
      name: t('calendar.view.month', '月表示'),
      onClick: () => {
        setViewMode('month');
        setSpeedDialOpen(false);
      }
    },
    { 
      icon: <ViewWeek />, 
      name: t('calendar.view.week', '週表示'),
      onClick: () => {
        setViewMode('week');
        setSpeedDialOpen(false);
      }
    },
    { 
      icon: <ViewDay />, 
      name: t('calendar.view.day', '日表示'),
      onClick: () => {
        setViewMode('day');
        setSpeedDialOpen(false);
      }
    },
    { 
      icon: <ViewList />, 
      name: t('calendar.view.list', 'リスト表示'),
      onClick: () => {
        setViewMode('list');
        setSpeedDialOpen(false);
      }
    },
  ];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 1000,
        }}
      >
        <MuiBottomNavigation
          value={selectedTab}
          onChange={handleTabChange}
          showLabels
          sx={{
            height: 56,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <BottomNavigationAction
            label={t('nav.calendar', 'カレンダー')}
            value="shift"
            icon={<CalendarMonth />}
          />
          <BottomNavigationAction
            label={t('nav.salary', '給料')}
            value="salary"
            icon={<AttachMoney />}
          />
          <BottomNavigationAction
            label={t('workplace.manager.title', 'バイト先管理')}
            value="workplace"
            icon={<Business />}
          />
          <BottomNavigationAction
            label=""
            value="add"
            icon={<Add />}
            sx={{
              '& .MuiBottomNavigationAction-label': {
                display: 'none',
              },
              '& .MuiSvgIcon-root': {
                fontSize: 28,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                padding: 0.5,
              },
            }}
          />
        </MuiBottomNavigation>
      </Box>

      {/* ＋ボタンメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            openEventDialog(today);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Event fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.event.newTitle', '新しい予定を追加')}</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            setViewMode('month');
            setAnchorEl(null);
          }}
          selected={viewMode === 'month'}
        >
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.view.month', '月表示')}</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            setViewMode('week');
            setAnchorEl(null);
          }}
          selected={viewMode === 'week'}
        >
          <ListItemIcon>
            <ViewWeek fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.view.week', '週表示')}</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            setViewMode('day');
            setAnchorEl(null);
          }}
          selected={viewMode === 'day'}
        >
          <ListItemIcon>
            <ViewDay fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.view.day', '日表示')}</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            setViewMode('list');
            setAnchorEl(null);
          }}
          selected={viewMode === 'list'}
        >
          <ListItemIcon>
            <ViewList fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.view.list', 'リスト表示')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};