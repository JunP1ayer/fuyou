// 🎯 認証方法選択画面
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  Google,
  Email,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface AuthMethodSelectionProps {
  onGoogleLogin: () => void;
  onEmailAuth: () => void;
  googleLoading?: boolean;
}

export const AuthMethodSelection: React.FC<AuthMethodSelectionProps> = ({
  onGoogleLogin,
  onEmailAuth,
  googleLoading = false,
}) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        px: 2,
        py: 4,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                扶養カレンダー
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                ログイン方法を選択してください
              </Typography>
            </Box>

            <Stack spacing={3}>
              {/* Googleログインボタン */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onGoogleLogin}
                  disabled={googleLoading}
                  startIcon={<Google />}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 2,
                    borderColor: '#4285f4',
                    color: '#4285f4',
                    borderWidth: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#3367d6',
                      bgcolor: '#f8f9ff',
                      borderWidth: 2,
                    },
                    '&:disabled': {
                      borderColor: '#ccc',
                      color: '#999',
                    },
                  }}
                >
                  {googleLoading ? 'ログイン中...' : 'Googleでログイン'}
                </Button>
              </motion.div>

              {/* 区切り線 */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  flex: 1,
                  height: '1px',
                  bgcolor: 'divider',
                },
                '&::after': {
                  content: '""',
                  flex: 1,
                  height: '1px',
                  bgcolor: 'divider',
                },
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                  または
                </Typography>
              </Box>

              {/* メールログインボタン */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onEmailAuth}
                  startIcon={<Email />}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0, #2196f3)',
                    },
                  }}
                >
                  メールアドレスでログイン
                </Button>
              </motion.div>
            </Stack>

            {/* 説明テキスト */}
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                <strong>Googleログイン:</strong> 1クリックで簡単・安全<br />
                <strong>メールログイン:</strong> 従来通りのメール認証
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};