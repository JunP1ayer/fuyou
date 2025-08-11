// 🏠 シンプル認証対応のメインコンテンツ
import React from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { SimpleAuthForm } from './auth/SimpleAuthForm';
import { Box, CircularProgress, Typography } from '@mui/material';

interface SimpleAppContentProps {
  children: React.ReactNode;
}

export const SimpleAppContent: React.FC<SimpleAppContentProps> = ({ children }) => {
  const { user, loading } = useSimpleAuth();

  // ローディング中
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          認証情報を確認しています...
        </Typography>
      </Box>
    );
  }

  // 未認証の場合、認証フォームを表示
  if (!user) {
    return <SimpleAuthForm />;
  }

  // 認証済みの場合、メインコンテンツを表示
  return <>{children}</>;
};