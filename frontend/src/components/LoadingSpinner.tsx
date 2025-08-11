// ⏳ ローディングスピナー - 統一されたローディング表示

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  variant?: 'default' | 'minimal' | 'card' | 'inline';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'default',
  message = '読み込み中...',
  size = 'medium',
  fullScreen = false,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  const containerSx = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 3,
  };

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={getSize()} />
      </Box>
    );
  }

  if (variant === 'inline') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={getSize()} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {message}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={containerSx}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={getSize()} 
            sx={{ 
              mb: 2,
              color: 'primary.main',
            }} 
          />
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {message}
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

// スケルトンローダー
interface SkeletonLoaderProps {
  variant: 'calendar' | 'list' | 'card' | 'form';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  count = 3,
}) => {
  if (variant === 'calendar') {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Grid container spacing={1}>
          {Array.from({ length: 35 }).map((_, index) => (
            <Grid item xs={12/7} key={index}>
              <Skeleton variant="rectangular" height={80} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (variant === 'list') {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Grid container spacing={2} sx={{ p: 2 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'form') {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Skeleton variant="text" width="30%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={40} />
          </Box>
        ))}
      </Box>
    );
  }

  return null;
};