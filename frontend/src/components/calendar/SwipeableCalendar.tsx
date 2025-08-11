// 📱 スワイプ対応カレンダーコンポーネント

import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { useCalendarStore } from '../../store/calendarStore';

interface SwipeableCalendarProps {
  onDateClick?: (date: string) => void;
}

export const SwipeableCalendar: React.FC<SwipeableCalendarProps> = ({ onDateClick }) => {
  const theme = useTheme();
  const { currentMonth, navigateMonth } = useCalendarStore();
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // スワイプ感度の設定
  const SWIPE_THRESHOLD = 50;
  const VELOCITY_THRESHOLD = 500;

  // スワイプジェスチャーハンドラー
  const handlePanStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePanEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    const shouldSwipe = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > VELOCITY_THRESHOLD;
    
    if (shouldSwipe) {
      if (offset.x > 0) {
        // 右にスワイプ = 前月
        navigateMonth('prev');
      } else {
        // 左にスワイプ = 次月
        navigateMonth('next');
      }
      
      // スワイプアニメーション
      controls.start({
        x: offset.x > 0 ? 100 : -100,
        opacity: 0.5,
        transition: { duration: 0.2 }
      }).then(() => {
        controls.start({
          x: 0,
          opacity: 1,
          transition: { duration: 0.3, type: 'spring', stiffness: 100 }
        });
      });
    } else {
      // 元の位置に戻る
      controls.start({
        x: 0,
        transition: { duration: 0.3, type: 'spring', stiffness: 100 }
      });
    }
  }, [navigateMonth, controls]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'pan-y', // 縦スクロールを許可、横スワイプはジェスチャーで制御
      }}
    >
      {/* スワイプインジケーター */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: alpha(theme.palette.background.paper, 0.9),
            borderRadius: 2,
            p: 1,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            ← 前月 | 次月 →
          </Typography>
        </Box>
      )}

      {/* カレンダーコンテンツ */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
        animate={controls}
        style={{
          height: '100%',
          width: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        whileDrag={{
          cursor: 'grabbing',
          scale: 0.98,
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: isDragging 
              ? alpha(theme.palette.primary.main, 0.02)
              : 'transparent',
            transition: 'background-color 0.2s ease',
          }}
        >
          {/* ヘッダー */}
          <Box sx={{ flexShrink: 0 }}>
            <CalendarHeader />
          </Box>
          
          {/* カレンダーグリッド */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <CalendarGrid onDateClick={onDateClick} />
          </Box>
        </Box>
      </motion.div>

      {/* 月変更アニメーション用のオーバーレイ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, 
            ${alpha(theme.palette.primary.main, 0)} 0%,
            ${alpha(theme.palette.primary.main, 0.1)} 50%,
            ${alpha(theme.palette.primary.main, 0)} 100%
          )`,
          pointerEvents: 'none',
          zIndex: 999,
        }}
      />
    </Box>
  );
};