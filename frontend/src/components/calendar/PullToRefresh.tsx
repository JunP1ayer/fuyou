// 🔄 プルトゥリフレッシュコンポーネント

import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Refresh } from '@mui/icons-material';
import { useI18n } from '@/hooks/useI18n';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // プル状態の計算
  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldTriggerRefresh = pullDistance >= threshold;

  // プルスタート
  const handlePanStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    if (disabled || isRefreshing) return;
    
    // 最上部にいる場合のみプルトゥリフレッシュを有効化
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  // プル中
  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    const distance = Math.max(0, info.offset.y);
    setPullDistance(distance);
  }, [disabled, isRefreshing, isPulling]);

  // プル終了
  const handlePanEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    setIsPulling(false);
    
    if (shouldTriggerRefresh) {
      setIsRefreshing(true);
      setPullDistance(threshold); // 固定位置
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        controls.start({
          y: 0,
          transition: { duration: 0.3, type: 'spring' }
        });
      }
    } else {
      setPullDistance(0);
      controls.start({
        y: 0,
        transition: { duration: 0.3, type: 'spring' }
      });
    }
  }, [disabled, isRefreshing, isPulling, shouldTriggerRefresh, threshold, onRefresh, controls]);

  // プルインジケーターの回転角度
  const rotateAngle = pullProgress * 180;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* プルインジケーター */}
      <motion.div
        animate={controls}
        style={{
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, 
            ${theme.palette.primary.light} 0%, 
            ${theme.palette.primary.main} 100%
          )`,
          borderRadius: '0 0 16px 16px',
          zIndex: 1000,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullProgress,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'white',
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            <motion.div
              animate={{ rotate: rotateAngle }}
              transition={{ duration: 0.1 }}
            >
              <Refresh sx={{ fontSize: 24 }} />
            </motion.div>
          )}
          
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: 'white',
            }}
          >
            {isRefreshing 
              ? t('pullToRefresh.refreshing', '更新中...') 
              : shouldTriggerRefresh 
                ? t('pullToRefresh.releaseToRefresh', '離して更新') 
                : t('pullToRefresh.pullToRefresh', 'プルして更新')
            }
          </Typography>
        </Box>
      </motion.div>

      {/* メインコンテンツ */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
        style={{
          height: '100%',
          width: '100%',
          transform: `translateY(${isPulling || isRefreshing ? pullDistance * 0.5 : 0}px)`,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
      >
        {children}
      </motion.div>

      {/* プル時のオーバーレイエフェクト */}
      {(isPulling || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: pullProgress * 0.1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center top, 
              ${theme.palette.primary.light}20 0%,
              transparent 50%
            )`,
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </Box>
  );
};