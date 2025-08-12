/**
 * モバイルタッチ操作最適化コンポーネント
 * Material Design 3のタッチターゲット基準（48px）を満たすコンポーネント群
 */

import React from 'react';
import {
  Button,
  IconButton,
  Fab,
  Chip,
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  ButtonProps,
  IconButtonProps,
  FabProps,
  ChipProps,
  CardProps,
} from '@mui/material';

// タッチターゲットの最小サイズ（Material Design 3準拠）
const TOUCH_TARGET_SIZE = 48;
const TOUCH_TARGET_SIZE_SMALL = 40;

/**
 * タッチ最適化されたボタンコンポーネント
 */
export const TouchButton: React.FC<ButtonProps & { touchSize?: 'normal' | 'large' }> = ({
  children,
  touchSize = 'normal',
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const minHeight = touchSize === 'large' ? 56 : TOUCH_TARGET_SIZE;
  
  return (
    <Button
      {...props}
      sx={{
        minHeight: isMobile ? minHeight : 'auto',
        minWidth: isMobile ? minHeight : 'auto',
        px: isMobile ? 3 : 2,
        py: isMobile ? 1.5 : 1,
        fontSize: isMobile ? '1rem' : '0.875rem',
        borderRadius: isMobile ? 3 : 2,
        '& .MuiButton-startIcon': {
          marginRight: isMobile ? 1.5 : 1,
        },
        '& .MuiButton-endIcon': {
          marginLeft: isMobile ? 1.5 : 1,
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

/**
 * タッチ最適化されたアイコンボタンコンポーネント
 */
export const TouchIconButton: React.FC<IconButtonProps & { touchSize?: 'normal' | 'large' }> = ({
  children,
  touchSize = 'normal',
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const size = touchSize === 'large' ? 56 : TOUCH_TARGET_SIZE;
  
  return (
    <IconButton
      {...props}
      sx={{
        width: isMobile ? size : 'auto',
        height: isMobile ? size : 'auto',
        padding: isMobile ? 1.5 : 1,
        '& .MuiSvgIcon-root': {
          fontSize: isMobile ? '1.5rem' : '1.25rem',
        },
        ...sx,
      }}
    >
      {children}
    </IconButton>
  );
};

/**
 * タッチ最適化されたFABコンポーネント
 */
export const TouchFab: React.FC<FabProps & { touchSize?: 'normal' | 'large' }> = ({
  children,
  touchSize = 'normal',
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Fab
      {...props}
      size={isMobile ? (touchSize === 'large' ? 'large' : 'medium') : 'small'}
      sx={{
        '& .MuiSvgIcon-root': {
          fontSize: isMobile ? '1.5rem' : '1.25rem',
        },
        ...sx,
      }}
    >
      {children}
    </Fab>
  );
};

/**
 * タッチ最適化されたChipコンポーネント
 */
export const TouchChip: React.FC<ChipProps> = ({
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Chip
      {...props}
      sx={{
        height: isMobile ? TOUCH_TARGET_SIZE_SMALL : 'auto',
        minWidth: isMobile ? TOUCH_TARGET_SIZE_SMALL : 'auto',
        fontSize: isMobile ? '0.9rem' : '0.8125rem',
        '& .MuiChip-label': {
          padding: isMobile ? '8px 12px' : '4px 8px',
        },
        '& .MuiChip-deleteIcon': {
          fontSize: isMobile ? '1.25rem' : '1rem',
          margin: isMobile ? '0 8px 0 -4px' : '0 5px 0 -6px',
        },
        ...sx,
      }}
    />
  );
};

/**
 * タッチ最適化されたカードコンポーネント
 */
export const TouchCard: React.FC<CardProps & { interactive?: boolean }> = ({
  children,
  interactive = false,
  sx,
  onClick,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Card
      {...props}
      onClick={onClick}
      sx={{
        borderRadius: isMobile ? 4 : 2,
        ...(interactive && {
          cursor: 'pointer',
          minHeight: isMobile ? TOUCH_TARGET_SIZE : 'auto',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: theme.shadows[4],
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

/**
 * タッチジェスチャー情報表示コンポーネント
 */
export const TouchGestureHint: React.FC<{
  gesture: 'tap' | 'swipe' | 'pinch' | 'long-press';
  description: string;
}> = ({ gesture, description }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!isMobile) return null;
  
  const gestureIcons = {
    'tap': '👆',
    'swipe': '👈',
    'pinch': '👌',
    'long-press': '👆⏱️'
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        backgroundColor: 'action.hover',
        borderRadius: 1,
        fontSize: '0.75rem',
        color: 'text.secondary',
      }}
    >
      <Typography component="span" sx={{ fontSize: '1rem' }}>
        {gestureIcons[gesture]}
      </Typography>
      <Typography variant="caption">
        {description}
      </Typography>
    </Box>
  );
};

/**
 * スワイプ可能なコンテナコンポーネント
 */
export const SwipeableContainer: React.FC<{
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}> = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown 
}) => {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };
  
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    
    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -minSwipeDistance && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > minSwipeDistance && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -minSwipeDistance && onSwipeDown) {
        onSwipeDown();
      }
    }
  };
  
  return (
    <Box
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      sx={{
        width: '100%',
        height: '100%',
        touchAction: 'pan-x pan-y',
      }}
    >
      {children}
    </Box>
  );
};

/**
 * プルトゥリフレッシュコンポーネント
 */
export const PullToRefresh: React.FC<{
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
}> = ({ children, onRefresh, refreshing = false }) => {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  
  const maxPullDistance = 100;
  const triggerDistance = 60;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(distance, maxPullDistance));
    }
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > triggerDistance) {
      await onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };
  
  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ position: 'relative' }}
    >
      {isPulling && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: pullDistance,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'primary.light',
            zIndex: 1,
            opacity: Math.min(pullDistance / triggerDistance, 1),
          }}
        >
          <Typography variant="body2" color="primary.main">
            {pullDistance > triggerDistance ? '離して更新' : '引っ張って更新'}
          </Typography>
        </Box>
      )}
      <Box sx={{ transform: `translateY(${isPulling ? pullDistance : 0}px)` }}>
        {children}
      </Box>
    </Box>
  );
};