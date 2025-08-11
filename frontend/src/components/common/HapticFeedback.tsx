// 🤲 ハプティックフィードバック & タッチフィードバックコンポーネント

import React, { useCallback, useRef } from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

// ハプティックフィードバックの種類
export type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'selection' | 'impact';

// ハプティックフィードバック実行関数
export const triggerHapticFeedback = (type: HapticType = 'light') => {
  // Web Vibration API（Android対応）
  if ('vibrator' in navigator || 'vibrate' in navigator) {
    const vibrationPatterns: Record<HapticType, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30],
      rigid: [5, 5, 10],
      soft: [15, 5, 10],
      selection: [5],
      impact: [25, 10, 25],
    };
    
    navigator.vibrate(vibrationPatterns[type]);
  }

  // iOS Safari用のタッチフィードバック（擬似）
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // iOSではWeb Vibration APIが制限されているため、
    // 視覚的フィードバックで代用
    console.log(`Haptic feedback: ${type}`);
  }
};

interface TouchFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  hapticType?: HapticType;
  disabled?: boolean;
  pressScale?: number;
  rippleEffect?: boolean;
  className?: string;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  onPress,
  hapticType = 'light',
  disabled = false,
  pressScale = 0.95,
  rippleEffect = true,
  className,
}) => {
  const theme = useTheme();
  const rippleRef = useRef<HTMLDivElement>(null);

  // タッチハンドリング
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    // ハプティックフィードバック
    triggerHapticFeedback(hapticType);
    
    // リップル効果
    if (rippleEffect && rippleRef.current) {
      const rect = rippleRef.current.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = alpha(theme.palette.primary.main, 0.3);
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple-effect 0.6s ease-out';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.marginLeft = '-10px';
      ripple.style.marginTop = '-10px';
      
      rippleRef.current.appendChild(ripple);
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 600);
    }
  }, [disabled, hapticType, rippleEffect, theme]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    triggerHapticFeedback(hapticType);
    onPress?.();
  }, [disabled, hapticType, onPress]);

  return (
    <>
      <style>
        {`
          @keyframes ripple-effect {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
      </style>
      
      <motion.div
        ref={rippleRef}
        className={className}
        whileTap={{ 
          scale: disabled ? 1 : pressScale,
          transition: { duration: 0.1 }
        }}
        whileHover={!disabled ? { 
          scale: 1.02,
          transition: { duration: 0.2 }
        } : {}}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          opacity: disabled ? 0.6 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

// 高度なタッチジェスチャーコンポーネント
interface AdvancedTouchProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  longPressDuration?: number;
  swipeThreshold?: number;
  hapticEnabled?: boolean;
}

export const AdvancedTouch: React.FC<AdvancedTouchProps> = ({
  children,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  longPressDuration = 500,
  swipeThreshold = 50,
  hapticEnabled = true,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // 長押し検出
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        if (hapticEnabled) triggerHapticFeedback('medium');
        onLongPress();
      }, longPressDuration);
    }
  }, [onLongPress, longPressDuration, hapticEnabled]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // 長押しタイマーをクリア
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // スワイプ判定
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (hapticEnabled) triggerHapticFeedback('selection');
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 横スワイプ
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // 縦スワイプ
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    } else if (deltaTime < 200) {
      // タップ判定
      if (hapticEnabled) triggerHapticFeedback('light');
      onTap?.();
    }

    touchStartRef.current = null;
  }, [onTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold, hapticEnabled]);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {children}
    </Box>
  );
};