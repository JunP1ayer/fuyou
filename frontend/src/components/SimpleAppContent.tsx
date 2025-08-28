// 🏠 シンプル認証対応のメインコンテンツ
import React from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { SimpleAuthForm } from './auth/SimpleAuthForm';
import { Box, CircularProgress, Typography } from '@mui/material';
// import { useUserProfileStore } from '../store/userProfileStore';
// import { FuyouCheckDialog } from './FuyouCheckDialog';

interface SimpleAppContentProps {
  children: React.ReactNode;
}

export const SimpleAppContent: React.FC<SimpleAppContentProps> = ({ children }) => {
  const { user, loading, showEmailConfirmation } = useSimpleAuth();
  // const { isFirstLogin, showFuyouCheckDialog } = useUserProfileStore();
  // const [firstLoginFuyouCheckOpen, setFirstLoginFuyouCheckOpen] = useState(false);

  // デバッグログ: 認証状態の変化を追跡
  React.useEffect(() => {
    console.log('🏠 SimpleAppContent - Auth state changed:', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      showEmailConfirmation,
      timestamp: new Date().toISOString()
    });
  }, [user, loading, showEmailConfirmation]);

  // 初回ログイン時の扶養チェック表示は無効化（給料タブで行う）
  // useEffect(() => {
  //   if (user && isFirstLogin && !showEmailConfirmation) {
  //     // ログイン完了後、少し待ってから扶養チェックを表示
  //     const timer = setTimeout(() => {
  //       setFirstLoginFuyouCheckOpen(true);
  //     }, 1000);
  //     
  //     return () => clearTimeout(timer);
  //   }
  //   return undefined;
  // }, [user, isFirstLogin, showEmailConfirmation]);

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
  // メール確認中の場合も認証フォームを表示（状態はコンテキストで管理）
  if (!user || showEmailConfirmation) {
    return <SimpleAuthForm />;
  }

  // 認証済みの場合、メインコンテンツを表示
  return (
    <>
      {children}
      
      {/* 初回ログイン時の扶養チェックダイアログは無効化（給料タブで行う） */}
      {/* <FuyouCheckDialog
        open={firstLoginFuyouCheckOpen}
        onClose={() => setFirstLoginFuyouCheckOpen(false)}
        isFirstTime={true}
      /> */}
    </>
  );
};