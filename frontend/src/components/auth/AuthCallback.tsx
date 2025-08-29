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
  const [countdown, setCountdown] = useState(10);
  const [authStatus, setAuthStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ボディのスクロールを無効化
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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
          // 認証成功 - 即座にアプリのメイン画面にリダイレクト（UI表示なし）
          window.location.href = '/';
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

  // カウントダウン処理は不要（即座にリダイレクトするため）

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  // 処理中の表示
  if (authStatus === 'processing') {
    return (
      <Box
        sx={{
          position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden', // スクロール禁止
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
          position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden', // スクロール禁止
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden !important', // スクロール禁止を強制
        overflowX: 'hidden !important',
        overflowY: 'hidden !important',
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
                {/* アイコンをシンプルなチェックマークに変更 */}
                <Typography 
                  sx={{ 
                    fontSize: '4rem',
                    lineHeight: 1,
                    mb: 2,
                    color: '#666'
                  }}
                >
                  ✓
                </Typography>
              </motion.div>
              
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                ログイン完了
              </Typography>
              
              <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.6, fontWeight: 600 }}>
                メール認証が完了し、自動ログインしました
              </Typography>
            </Box>

            {/* 成功メッセージ - シンプル化 */}

            {/* 自動リダイレクト案内 */}
            <Typography variant="h6" color="text.primary" sx={{ mb: 3, fontWeight: 500 }}>
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
              今すぐアプリを開始
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};