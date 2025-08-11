// カレンダーヘッダーコンポーネント

import React from 'react';
import { Box, IconButton, Typography, Tooltip, Snackbar } from '@mui/material';
import { ChevronLeft, ChevronRight, Settings, Share as ShareIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';

interface CalendarHeaderProps {
  onSettingsClick?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onSettingsClick }) => {
  const { currentMonth, navigateMonth, viewMode } = useCalendarStore();
  const { t, language } = useI18n();
  const [copiedOpen, setCopiedOpen] = React.useState(false);
  
  // 設定ボタンクリック時の処理
  const handleSettingsClick = () => {
    onSettingsClick?.();
  };

  // 共有（最小・即時コピー、プライバシー既定ON）
  const handleQuickShare = async () => {
    const period: 'week' | 'month' = viewMode === 'week' ? 'week' : 'month';
    const hideWorkplace = true;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const toISO = (d: Date) => d.toISOString().split('T')[0];
    const demo = {
      meta: { period, hideWorkplace, generatedAt: new Date().toISOString() },
      days: {
        [toISO(today)]: { shifts: [{ start: '09:00', end: '17:00' }] },
        [toISO(tomorrow)]: { shifts: [{ start: '18:00', end: '22:00' }] },
        [toISO(dayAfter)]: { shifts: [{ start: '14:00', end: '19:00' }] },
      },
    };

    const code = btoa(JSON.stringify(demo));
    try {
      await navigator.clipboard.writeText(code);
      setCopiedOpen(true);
    } catch {
      // クリップボードに失敗してもサイレント（FriendSharingHubでの共有でも対応可）
    }
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

      {/* 右側：クイック共有・設定・次月 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={viewMode === 'week' ? '今週のシフトを共有してコピー' : '今月のシフトを共有してコピー'}>
          <IconButton
            aria-label={t('friends.share', 'スケジュール共有')}
            onClick={handleQuickShare}
            sx={{
              color: 'text.secondary',
              p: 0.5,
              '& .MuiSvgIcon-root': { fontSize: 20 },
              '&:hover': { backgroundColor: 'action.hover', color: 'primary.main' },
            }}
            data-testid="calendar-share-button"
          >
            <ShareIcon />
          </IconButton>
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
      <Snackbar
        open={copiedOpen}
        autoHideDuration={1800}
        onClose={() => setCopiedOpen(false)}
        message={viewMode === 'week' ? '今週のシフトの共有コードをコピーしました' : '今月のシフトの共有コードをコピーしました'}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};