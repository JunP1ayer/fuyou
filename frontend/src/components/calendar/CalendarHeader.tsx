// カレンダーヘッダーコンポーネント

import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, Settings } from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';

interface CalendarHeaderProps {
  onSettingsClick?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onSettingsClick }) => {
  const { currentMonth, navigateMonth } = useCalendarStore();
  const { t, language } = useI18n();
  
  // 設定ボタンクリック時の処理
  const handleSettingsClick = () => {
    onSettingsClick?.();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 0.5, // 左右パディング最小化
        py: 0.25, // 上下パディング最小化
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        minHeight: 32, // 高さを大幅縮小 48px→32px
      }}
    >
      {/* 左側：月切り替えボタン */}
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

      {/* 中央：年月表示 */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: 600,
          fontSize: '16px', // フォントサイズ縮小
          flex: 1,
          textAlign: 'center',
          color: 'text.primary',
        }}
      >
        {currentMonth.toLocaleDateString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'da' ? 'da-DK' : language === 'fi' ? 'fi-FI' : language === 'no' ? 'nb-NO' : 'ja-JP', { year: 'numeric', month: 'numeric' })}
      </Typography>

      {/* 右側：設定ボタンと次月ボタン */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
      </Box>
    </Box>
  );
};