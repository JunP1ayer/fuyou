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
              {/* Googleログインボタン - 公式デザイン */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onGoogleLogin}
                  disabled={googleLoading}
                  sx={{
                    py: 2,
                    px: 3,
                    borderColor: '#dadce0',
                    borderWidth: 1,
                    bgcolor: '#ffffff',
                    color: '#3c4043',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Roboto, arial, sans-serif',
                    textTransform: 'none',
                    boxShadow: '0 1px 1px 0 rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                      borderColor: '#d2d6da',
                      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.15)',
                    },
                    '&:active': {
                      bgcolor: '#e8eaed',
                    },
                    '&:disabled': {
                      bgcolor: '#f1f3f4',
                      borderColor: '#dadce0',
                      color: '#9aa0a6',
                    },
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    {/* Google G アイコン */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {googleLoading ? 'ログイン中...' : 'Googleでログイン'}
                    </span>
                  </Box>
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
                    background: 'linear-gradient(135deg, #81d4fa, #b3e5fc)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4fc3f7, #81d4fa)',
                    },
                  }}
                >
                  メールアドレスでログイン
                </Button>
              </motion.div>
            </Stack>

          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};