// カレンダーヘッダーコンポーネント

import React from 'react';
import { Box, IconButton, Typography, Tooltip, Switch, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, Settings, ViewAgenda, ViewModule } from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';
import { useFriendStore } from '../../store/friendStore';

interface CalendarHeaderProps {
  onSettingsClick?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onSettingsClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { headerMonth, navigateMonth, viewMode, goToToday } = useCalendarStore();
  const { t, language } = useI18n();
  
  // 縦スクロールモードの状態を取得（表示のみ）
  const verticalScrollMode = localStorage.getItem('calendarViewMode') === 'vertical';
  
  // 友達表示の状態管理
  const { friends, visibleFriendIds, setVisibleFriends } = useFriendStore();
  const hasFriends = friends.length > 0;
  const showingFriends = visibleFriendIds.length > 0;
  
  // 設定ボタンクリック時の処理
  const handleSettingsClick = () => {
    onSettingsClick?.();
  };

  // 友達表示の切り替え処理
  const handleFriendsToggle = () => {
    if (showingFriends) {
      // 友達を非表示にする
      setVisibleFriends([]);
    } else {
      // 全ての友達を表示する
      setVisibleFriends(friends.map(f => f.id));
    }
  };

  // カレンダータイトルタップで今日に戻る（横スクロールモード時のみ）
  const handleTitleClick = () => {
    if (isMobile && !verticalScrollMode) {
      goToToday();
    }
  };


  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1, md: 0.5 },
        py: { xs: 0.75, md: 0.25 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        minHeight: { xs: 56, md: 40 }, // モバイルは大きめに
      }}
    >
      {/* 左側：月切り替えボタン（縦スクロールモード時は非表示） */}
      {isMobile && verticalScrollMode ? (
        <Box sx={{ width: 40 }} /> // スペーサー（中央寄せのため少し広げる）
      ) : (
        <IconButton 
          aria-label={t('calendar.nav.prevMonth', '前月')}
          onClick={() => navigateMonth('prev')}
          sx={{ 
            color: 'text.secondary',
            p: 0.5, // ボタンサイズ縮小
            '& .MuiSvgIcon-root': { fontSize: 20 } // アイコンサイズ縮小
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}

      {/* 中央：年月表示（背景の月数字と連動） */}
      <Typography
        variant="h6"
        onClick={handleTitleClick}
        sx={{
          fontWeight: 700,
          fontSize: { xs: '24px', md: '18px' },
          letterSpacing: 0.3,
          flex: 1,
          textAlign: 'center',
          color: 'text.primary',
          lineHeight: 1.2,
          cursor: (isMobile && !verticalScrollMode) ? 'pointer' : 'default',
          '&:hover': (isMobile && !verticalScrollMode) ? {
            color: 'primary.main',
            transition: 'color 0.2s ease'
          } : {},
        }}
      >
        {headerMonth.toLocaleDateString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'da' ? 'da-DK' : language === 'fi' ? 'fi-FI' : language === 'no' ? 'nb-NO' : 'ja-JP', { year: 'numeric', month: 'numeric' })}
      </Typography>

      {/* 右側：友達表示切り替え・設定・次月 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* 友達表示オンオフスイッチ（設定の左側に配置） */}
        <Tooltip title={showingFriends ? '友達のシフトを非表示にする' : `友達のシフトも表示する (${friends.length}人)`}>
          <Switch
            checked={showingFriends}
            onChange={handleFriendsToggle}
            size="small"
            color="primary"
            disabled={!hasFriends}
            sx={{ 
              opacity: hasFriends ? 1 : 0.5,
              '& .MuiSwitch-switchBase': { 
                padding: '6px',
                '&.Mui-checked': {
                  color: 'primary.main',
                  '& + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                    opacity: 0.5,
                  },
                },
              },
              '& .MuiSwitch-track': {
                borderRadius: 10,
                width: 28,
                height: 16,
              },
              '& .MuiSwitch-thumb': {
                width: 12,
                height: 12,
              },
            }}
          />
        </Tooltip>
        
        <IconButton 
          aria-label={t('calendar.nav.settings', '設定')}
          onClick={handleSettingsClick}
          sx={{ 
            color: 'text.secondary',
            p: 0.5,
            '& .MuiSvgIcon-root': { fontSize: 20 },
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
            }
          }}
        >
          <Settings />
        </IconButton>
        {/* 次月ボタン（縦スクロールモード時は非表示） */}
        {isMobile && verticalScrollMode ? null : (
          <IconButton 
            aria-label={t('calendar.nav.nextMonth', '翌月')}
            onClick={() => navigateMonth('next')}
            sx={{ 
              color: 'text.secondary',
              p: 0.5,
              '& .MuiSvgIcon-root': { fontSize: 20 }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};