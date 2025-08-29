// 📧 メール確認画面コンポーネント
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Fade,
  Stack,
} from '@mui/material';
import {
  Mail,
  CheckCircle,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import simpleSupabase from '../../lib/simpleSupabase';

interface EmailConfirmationScreenProps {
  email: string;
  onBackToAuth: () => void;
  isExistingUser?: boolean;
}

export const EmailConfirmationScreen: React.FC<EmailConfirmationScreenProps> = ({
  email,
  onBackToAuth,
  isExistingUser = false,
}) => {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // ボディのスクロールを無効化
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // 60秒カウントダウン
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // メール確認の再送
  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setResendMessage(null);
    
    try {
      await simpleSupabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      setResendMessage('確認メールを再送しました！メールボックスをご確認ください。');
      setCountdown(60); // 60秒後に再送可能
    } catch (error: any) {
      setResendMessage('メールの再送に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setResending(false);
    }
  };

  // メール確認状況をチェック
  const checkEmailConfirmation = async (): Promise<void> => {
    setCheckingEmail(true);
    try {
      const { data } = await simpleSupabase.auth.getUser();
      if (data.user && data.user.email_confirmed_at) {
        // メール確認完了 - ログイン画面に戻る
        onBackToAuth();
        return;
      }
      setResendMessage('まだメール確認が完了していません。確認メール内のリンクをクリックしてください。');
    } catch (error) {
      setResendMessage('確認状況の取得に失敗しました。');
    } finally {
      setCheckingEmail(false);
    }
  };

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
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflow: 'hidden !important', // スクロール禁止を強制
        overflowX: 'hidden !important',
        overflowY: 'hidden !important',
        px: 2,
        py: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center', py: 4, alignItems: 'center' }}>
          {/* 上部セクション: アイコンとタイトル */}
          <Box sx={{ mb: 3 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Mail 
                sx={{ 
                  fontSize: 20, 
                  color: 'primary.main', 
                  mb: 2,
                  filter: 'drop-shadow(0 4px 8px rgba(25,118,210,0.3))'
                }} 
              />
            </motion.div>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: isExistingUser ? 'warning.main' : 'primary.main', 
                mb: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {isExistingUser ? 'ログイン確認' : 'メールを確認してください'}
            </Typography>
          </Box>

          {/* 送信先メールアドレス表示 - 上部に移動 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: isExistingUser ? 'warning.light' : 'grey.50', 
              borderRadius: 3, 
              border: '2px solid', 
              borderColor: isExistingUser ? 'warning.main' : 'primary.light',
              width: '100%',
              maxWidth: 350,
              textAlign: 'center'
            }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {isExistingUser ? '過去ログイン済み' : '送信先'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {email}
            </Typography>
            {isExistingUser && (
              <Typography variant="body2" color="warning.dark" sx={{ mt: 1, fontWeight: 500 }}>
                このメールアドレスは過去にログイン済みです
              </Typography>
            )}
            </Box>
          </Box>

          {/* 中央セクション: メール確認完了ボタン */}
          <Box sx={{ 
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            mb: 4
          }}>

          {/* メッセージ表示 */}
          {resendMessage && (
            <Fade in={true}>
              <Alert 
                severity={resendMessage.includes('失敗') ? 'error' : 'success'} 
                sx={{ mb: 3, textAlign: 'left' }}
              >
                {resendMessage}
              </Alert>
            </Fade>
          )}

          {/* メール確認完了ボタン - 大きな円で表示 */}
          <Button
            onClick={checkEmailConfirmation}
            variant="contained"
            disabled={checkingEmail}
            sx={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #2196f3)',
                boxShadow: '0 12px 32px rgba(25, 118, 210, 0.5)',
                transform: 'scale(1.05)',
              },
              '&:disabled': {
                background: '#f5f5f5',
                color: '#bdbdbd',
                boxShadow: 'none',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {checkingEmail ? (
              <CircularProgress size={40} color="inherit" />
            ) : (
              <>
                <CheckCircle sx={{ fontSize: 48 }} />
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  メール確認完了
                </Typography>
              </>
            )}
          </Button>
          </Box>

          {/* 下部セクション: 小さなリンク */}
          <Stack spacing={2} alignItems="center">
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <Typography
                component="button"
                onClick={handleResendEmail}
                disabled={resending || countdown > 0}
                sx={{
                  fontSize: '0.875rem',
                  color: (resending || countdown > 0) ? 'text.disabled' : 'primary.main',
                  background: 'none',
                  border: 'none',
                  cursor: (resending || countdown > 0) ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 400,
                  '&:hover': (resending || countdown > 0) ? {} : {
                    color: 'primary.dark',
                  }
                }}
              >
                {countdown > 0 
                  ? `確認メールを再送 (${countdown}秒後)`
                  : resending 
                    ? '送信中...'
                    : '確認メールを再送'
                }
              </Typography>

              <Typography
                component="button"
                onClick={onBackToAuth}
                sx={{
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 400,
                  '&:hover': {
                    color: 'text.primary',
                  }
                }}
              >
                ログイン画面に戻る
              </Typography>
            </Box>

            {/* トラブルシューティング */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography
                component="button"
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                sx={{
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 400,
                  '&:hover': {
                    color: 'text.primary',
                  }
                }}
              >
                確認メールが届かない場合 {showTroubleshooting ? '▲' : '▼'}
              </Typography>

              {showTroubleshooting && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    以下をご確認ください：
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      迷惑メールフォルダをご確認ください
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      メールアドレスが正しく入力されているか確認
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      上記の「確認メールを再送」をお試しください
                    </Typography>
                    <Typography component="li" variant="body2">
                      数分待ってから再度お試しください
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      </motion.div>
    </Box>
  );
};