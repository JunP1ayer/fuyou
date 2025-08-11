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
import { AuthForm } from './AuthForm';

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
}) => (
  <Backdrop
    open
    sx={{
      zIndex: 9999,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          🌟 FUYOU PRO
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          学生向け扶養管理アプリ
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <CircularProgress size={40} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          {message}
        </Typography>
      </motion.div>
    </Box>
  </Backdrop>
);

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
}) => {
  const { user, loading, initialized } = useAuth();

  // 初期化中
  if (!initialized) {
    return <LoadingScreen message="認証情報を確認しています..." />;
  }

  // ローディング中
  if (loading) {
    return <LoadingScreen message="処理中です..." />;
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