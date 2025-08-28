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
                  🎉 メール認証完了！
                </Typography>
                <Typography variant="body2">
                  <strong>アプリに戻って、メール確認完了ボタンを押してログインしましょう！</strong>
                </Typography>
              </Stack>
            </Alert>

            {/* 次のステップ案内 */}
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              bgcolor: 'primary.light', 
              borderRadius: 3, 
              border: '2px solid', 
              borderColor: 'primary.main' 
            }}>
              <Typography variant="h6" color="primary.dark" sx={{ mb: 1, fontWeight: 700 }}>
                📱 重要な次のステップ
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500, lineHeight: 1.8 }}>
                <strong>1. アプリ（元のタブ）に戻る</strong><br/>
                <strong>2. 大きな円形の「メール確認完了」ボタンをクリック</strong><br/>
                <strong>3. 自動ログイン完了！</strong>
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
              🚀 今すぐアプリに戻ってログイン！
            </Button>

            {/* 補足情報 */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="body2" color="warning.dark" sx={{ lineHeight: 1.6, fontWeight: 500, mb: 2 }}>
                ⚠️ このタブは閉じても大丈夫です<br/>
                必ずアプリのタブに戻って「メール確認完了」ボタンを押してください
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                💡 扶養カレンダーでお金の管理を始めましょう！
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};