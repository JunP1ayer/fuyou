// 📧 メール確認画面コンポーネント
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Fade,
  Stack,
  Divider,
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
}

export const EmailConfirmationScreen: React.FC<EmailConfirmationScreenProps> = ({
  email,
  onBackToAuth,
}) => {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // 60秒カウントダウン
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
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
            
            {/* アイコンとタイトル */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Mail 
                  sx={{ 
                    fontSize: 64, 
                    color: 'primary.main', 
                    mb: 2,
                    filter: 'drop-shadow(0 4px 8px rgba(25,118,210,0.3))'
                  }} 
                />
              </motion.div>
              
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                メールを確認してください
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                アカウントを有効化するため、確認メールを送信しました
              </Typography>
            </Box>

            {/* 送信先メールアドレス表示 */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'grey.200' 
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                送信先
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {email}
              </Typography>
            </Box>

            {/* 手順説明 */}
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  📩 次の手順で確認を完了してください：
                </Typography>
                <Typography variant="body2" component="div">
                  1. メールボックス（受信トレイ）を確認<br/>
                  2. 「扶養管理カレンダー - アカウント確認」の件名のメールを開く<br/>
                  3. メール内の「アカウントを確認」ボタンをクリック
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ※メールが見つからない場合は、迷惑メールフォルダもご確認ください
                </Typography>
              </Stack>
            </Alert>

            {/* メッセージ表示 */}
            {resendMessage && (
              <Fade in={true}>
                <Alert 
                  severity={resendMessage.includes('失敗') ? 'error' : 'success'} 
                  sx={{ mb: 2, textAlign: 'left' }}
                >
                  {resendMessage}
                </Alert>
              </Fade>
            )}

            {/* アクションボタン */}
            <Stack spacing={2}>
              <Button
                onClick={checkEmailConfirmation}
                variant="contained"
                size="large"
                disabled={checkingEmail}
                startIcon={checkingEmail ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
                  },
                }}
              >
                確認完了をチェック
              </Button>

              <Button
                onClick={handleResendEmail}
                variant="outlined"
                size="large"
                disabled={resending || countdown > 0}
                startIcon={resending ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {countdown > 0 
                  ? `確認メールを再送 (${countdown}秒後)`
                  : resending 
                    ? '送信中...'
                    : '確認メールを再送'
                }
              </Button>

              <Divider sx={{ my: 1 }} />

              <Button
                onClick={onBackToAuth}
                variant="text"
                size="large"
                startIcon={<ArrowBack />}
                sx={{
                  py: 1,
                  fontSize: '0.9rem',
                  color: 'text.secondary',
                }}
              >
                ログイン画面に戻る
              </Button>
            </Stack>

            {/* 補足情報 */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                確認メールが届かない場合は、迷惑メールフォルダをご確認いただくか、<br/>
                メールアドレスが正しいかご確認の上、再送をお試しください。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};