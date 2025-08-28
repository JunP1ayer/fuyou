// 📧 認証コールバック画面 - メール確認完了後の案内
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import supabase from '../../lib/supabaseClient';

export const AuthCallback: React.FC = () => {
  const [countdown, setCountdown] = useState(5);
  const [authStatus, setAuthStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // メール認証完了後の自動ログイン処理
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLのハッシュから認証情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setAuthStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          // 認証成功 - ログイン状態になっている
          setAuthStatus('success');
          
          // 3秒後にアプリのメイン画面にリダイレクト
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        } else {
          setAuthStatus('error');
          setErrorMessage('認証セッションの取得に失敗しました');
        }
      } catch (error) {
        console.error('Auth callback processing error:', error);
        setAuthStatus('error');
        setErrorMessage('認証処理中にエラーが発生しました');
      }
    };

    handleAuthCallback();
  }, []);

  // カウントダウン処理（成功時のみ）
  useEffect(() => {
    if (authStatus === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            window.location.href = '/';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [authStatus]);

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  // 処理中の表示
  if (authStatus === 'processing') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          px: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              認証処理中...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              メール認証を確認しています
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // エラーの表示
  if (authStatus === 'error') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          px: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              認証エラー: {errorMessage}
            </Alert>
            <Button
              onClick={handleBackToApp}
              variant="contained"
              startIcon={<ArrowBack />}
            >
              アプリに戻る
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 成功時の表示
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            
            {/* 成功アイコンとタイトル */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle 
                  sx={{ 
                    fontSize: 80, 
                    color: 'success.main', 
                    mb: 2,
                    filter: 'drop-shadow(0 4px 8px rgba(76,175,80,0.3))'
                  }} 
                />
              </motion.div>
              
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                ✅ ログイン完了！
              </Typography>
              
              <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.6, fontWeight: 600 }}>
                メール認証が完了し、自動ログインしました
              </Typography>
            </Box>

            {/* 成功メッセージ */}
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Stack spacing={1}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  🎉 認証・ログイン完了！
                </Typography>
                <Typography variant="body2">
                  自動的にアプリのメイン画面に移動します
                </Typography>
              </Stack>
            </Alert>

            {/* 自動リダイレクト案内 */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {countdown > 0 ? (
                `${countdown}秒後に自動でアプリに移動します...`
              ) : (
                'アプリに移動しています...'
              )}
            </Typography>

            {/* 手動で戻るボタン */}
            <Button
              onClick={handleBackToApp}
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0, #2196f3)',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              🚀 今すぐアプリを開始！
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};