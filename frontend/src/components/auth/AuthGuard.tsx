// 🔐 認証ガードコンポーネント

import React, { ReactNode } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  CircularProgress,
  Typography,
  Backdrop,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthForm } from './AuthForm';
import { LanguageSelectionScreen } from './LanguageSelectionScreen';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'アプリを起動しています...' 
}) => {
  const { t } = useLanguage();
  
  return (
  <Backdrop
    open
    sx={{
      zIndex: 9999,
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      color: '#1a1a1a',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 500, 
            mb: 4,
            color: '#1a1a1a',
            letterSpacing: '-0.01em',
          }}
        >
          {t('app.name', '扶養管理カレンダー')}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Box sx={{ position: 'relative', mb: 3 }}>
          <CircularProgress 
            size={32} 
            sx={{ 
              color: '#5ac8fa',
            }} 
          />
        </Box>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            fontWeight: 400,
            fontSize: '0.9rem',
          }}
        >
          {message}
        </Typography>
      </motion.div>
    </Box>
  </Backdrop>
  );
};

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
}) => {
  const { user, loading, initialized } = useAuth();
  const { t, isLanguageSelected } = useLanguage();

  // 初期化中
  if (!initialized) {
    return <LoadingScreen message={t('loading.authenticating', '認証情報を確認しています...')} />;
  }

  // ローディング中
  if (loading) {
    return <LoadingScreen message={t('loading.processing', '処理中です...')} />;
  }

  // 言語選択がまだの場合
  if (!isLanguageSelected) {
    return <LanguageSelectionScreen />;
  }

  // 認証が必要だが未認証の場合
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Dialog
        open
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'visible',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <AuthForm />
        </DialogContent>
      </Dialog>
    );
  }

  // 認証済み、または認証不要の場合
  return <>{children}</>;
};

// 認証が必要なページ用のラッパー
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth>{children}</AuthGuard>
);

// 認証が不要なページ用のラッパー
export const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={false}>{children}</AuthGuard>
);