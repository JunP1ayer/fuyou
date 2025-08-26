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
} from '@mui/material';
import {
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const AuthCallback: React.FC = () => {
  const [countdown, setCountdown] = useState(5);

  // 5秒後に自動でログイン画面にリダイレクト
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // ログイン画面にリダイレクト
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
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
                ✅ 認証完了！
              </Typography>
              
              <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.6, fontWeight: 600 }}>
                メール確認が完了しました
              </Typography>
            </Box>

            {/* 成功メッセージ */}
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Stack spacing={1}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  🎉 アカウントの有効化が完了しました！
                </Typography>
                <Typography variant="body2">
                  扶養管理カレンダーをご利用いただくために、<br/>
                  アプリに戻ってログインしてください。
                </Typography>
              </Stack>
            </Alert>

            {/* 次のステップ案内 */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'grey.200' 
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                📱 次のステップ
              </Typography>
              <Typography variant="body2" color="text.primary">
                1. アプリ（タブ）に戻る<br/>
                2. 登録時のメールアドレス・パスワードでログイン<br/>
                3. 扶養管理機能をお楽しみください！
              </Typography>
            </Box>

            {/* 自動リダイレクト案内 */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {countdown > 0 ? (
                `${countdown}秒後に自動でアプリに戻ります...`
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
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
                },
              }}
            >
              今すぐアプリに戻る
            </Button>

            {/* 補足情報 */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                💡 ブックマークに追加していただくと、次回から素早くアクセスできます。<br/>
                ご利用ありがとうございます！
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};