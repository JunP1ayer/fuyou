// カレンダーヘッダーコンポーネント

import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';

export const CalendarHeader: React.FC = () => {
  const { currentMonth, navigateMonth, openEventDialog } = useCalendarStore();
  
  // プラスボタンクリック時の処理（今日の日付で新規予定作成）
  const handleAddClick = () => {
    const today = new Date().toISOString().split('T')[0];
    openEventDialog(today);
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
        {format(currentMonth, 'yyyy年M月', { locale: ja })}
      </Typography>

      {/* 右側：プラスボタンと次月ボタン */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton 
          onClick={handleAddClick}
          sx={{ 
            color: 'primary.main',
            p: 0.5,
            '& .MuiSvgIcon-root': { fontSize: 20 },
            '&:hover': {
              backgroundColor: 'primary.lighter',
            }
          }}
        >
          <Add />
        </IconButton>
        <IconButton 
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