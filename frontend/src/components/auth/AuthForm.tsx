// 🔐 認証フォームコンポーネント（ログイン・登録）

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  Link,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Login as LoginIcon,
  PersonAdd,
  Google,
  GitHub,
  Apple,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageDropdown } from '../common/LanguageDropdown';
import type { LoginCredentials, SignupCredentials, AuthError } from '../../types/auth';
import simpleSupabase from '../../lib/simpleSupabase';

interface AuthFormProps {
  defaultTab?: 'login' | 'signup';
  onClose?: () => void;
}

// 共通のTextFieldスタイル
const textFieldSx = {
  mb: 1.5,
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: '#fafbfc',
    border: 'none',
    '& fieldset': {
      border: '1px solid #e1e8ed',
    },
    '&:hover fieldset': {
      border: '1px solid #5ac8fa',
    },
    '&.Mui-focused fieldset': {
      border: '2px solid #5ac8fa',
      boxShadow: '0 0 0 3px rgba(90, 200, 250, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#666',
    '&.Mui-focused': {
      color: '#5ac8fa',
    },
  },
};

export const AuthForm: React.FC<AuthFormProps> = ({
  defaultTab = 'signup',
  onClose
}) => {
  const theme = useTheme();
  const { login, signup, resetPassword, loading } = useAuth();
  const { t } = useLanguage();
  
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // ログインフォーム状態
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  // 登録フォーム状態
  const [signupForm, setSignupForm] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // タブ切り替え
  const handleTabChange = (_: React.SyntheticEvent, newValue: 'login' | 'signup') => {
    setCurrentTab(newValue);
    setError(null);
    setResetEmailSent(false);
  };

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      console.log('📝 AuthForm: Starting login process...');
      await login(loginForm);
      console.log('📝 AuthForm: Login completed, closing dialog...');
      // ログイン成功後、少し待ってからダイアログを閉じる
      setTimeout(() => {
        console.log('📝 AuthForm: Calling onClose...');
        onClose?.();
      }, 100);
    } catch (error) {
      console.error('📝 AuthForm: Login error:', error);
      const authError = error as AuthError;
      setError(authError.message);
    }
  };

  // 登録処理
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. 既存ユーザーチェック
      console.log('📝 AuthForm: Checking if user already exists...');
      const { data: existingUserData, error: checkError } = await simpleSupabase
        .rpc('check_existing_user_by_email', { p_email: signupForm.email });

      if (checkError) {
        console.error('📝 AuthForm: Error checking existing user:', checkError);
      } else if (existingUserData && existingUserData[0]?.user_exists) {
        // 既存ユーザーが見つかった場合
        console.log('📝 AuthForm: Existing user found, switching to login tab');
        setError('このメールアドレスは既に登録済みです。ログインをお試しください。');
        
        // 3秒後にログインタブに切り替え
        setTimeout(() => {
          setCurrentTab('login');
          setError(null);
        }, 3000);
        return;
      }

      // 2. 新規ユーザーの場合は通常の登録処理
      console.log('📝 AuthForm: Starting signup process...');
      await signup(signupForm);
      console.log('📝 AuthForm: Signup completed, closing dialog...');
      // 新規登録成功後、少し待ってからダイアログを閉じる
      setTimeout(() => {
        console.log('📝 AuthForm: Calling onClose...');
        onClose?.();
      }, 100);
    } catch (error) {
      console.error('📝 AuthForm: Signup error:', error);
      const authError = error as AuthError;
      setError(authError.message);
    }
  };

  // パスワードリセット
  const handlePasswordReset = async () => {
    if (!loginForm.email) {
      setError('メールアドレスを入力してください');
      return;
    }

    try {
      await resetPassword(loginForm.email);
      setResetEmailSent(true);
      setError(null);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          maxWidth: 420,
          mx: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: 4,
          overflow: 'visible',
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            px: 3,
            position: 'relative',
          }}
        >
          {/* 言語選択ドロップダウン（小型版） */}
          <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ transform: 'scale(0.7)' }}>
              <LanguageDropdown variant="outlined" showCurrentFlag />
            </Box>
          </Box>
          
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 500, 
              mb: 0.5,
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
{t('app.name', '扶養カレンダー')}
          </Typography>
        </Box>

        <CardContent sx={{ px: 3, pb: 3, pt: 0 }}>
          {/* タブ */}
          <Box sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex',
                background: '#f8f9fa',
                borderRadius: 3,
                p: 0.5,
                mb: 1,
              }}
            >
              <Box
                onClick={() => handleTabChange(null, 'login')}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  py: 1.5,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: currentTab === 'login' ? '#fff' : 'transparent',
                  boxShadow: currentTab === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  color: currentTab === 'login' ? '#1a1a1a' : '#666',
                  fontWeight: currentTab === 'login' ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
{t('auth.login', 'ログイン')}
              </Box>
              <Box
                onClick={() => handleTabChange(null, 'signup')}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  py: 1.5,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: currentTab === 'signup' ? '#fff' : 'transparent',
                  boxShadow: currentTab === 'signup' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  color: currentTab === 'signup' ? '#1a1a1a' : '#666',
                  fontWeight: currentTab === 'signup' ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
{t('auth.signup', '新規登録')}
              </Box>
            </Box>
          </Box>

          {/* エラー表示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* パスワードリセット成功メッセージ */}
          <AnimatePresence>
            {resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  パスワードリセットメールを送信しました！
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* フォーム内容 */}
          <AnimatePresence mode="wait">
            {currentTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box component="form" onSubmit={handleLogin} sx={{ space: 2 }}>
                  <TextField
                    fullWidth
                    type="email"
                    label={t('auth.email', 'メールアドレス')}
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    sx={textFieldSx}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label={t('auth.password', 'パスワード')}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...textFieldSx, mb: 1 }}
                    required
                  />

                  <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <Link
                      component="button"
                      type="button"
                      onClick={handlePasswordReset}
                      sx={{ 
                        fontSize: '0.875rem',
                        color: '#666',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#5ac8fa',
                          textDecoration: 'underline',
                        },
                      }}
                    >
{t('auth.forgotPassword', 'パスワードを忘れた方')}
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.8,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #5ac8fa 0%, #4fb3e9 100%)',
                      boxShadow: '0 4px 16px rgba(90, 200, 250, 0.3)',
                      border: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4fb3e9 0%, #3ea5e0 100%)',
                        boxShadow: '0 6px 20px rgba(90, 200, 250, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
{loading ? <CircularProgress size={24} color="inherit" /> : t('auth.loginButton', 'ログイン')}
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Box component="form" onSubmit={handleSignup} sx={{ space: 2 }}>
                  <TextField
                    fullWidth
                    label={t('auth.name', 'お名前')}
                    placeholder="山田 太郎"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                    sx={textFieldSx}
                    required
                  />

                  <TextField
                    fullWidth
                    type="email"
                    label={t('auth.email', 'メールアドレス')}
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    sx={textFieldSx}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label={t('auth.password', 'パスワード')}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText={t('auth.passwordHelper', '8文字以上、大文字・数字を含む')}
                    sx={{ ...textFieldSx, mb: 1.5 }}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label={t('auth.confirmPassword', 'パスワード（確認）')}
                    placeholder="••••••••"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...textFieldSx, mb: 2 }}
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.8,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #5ac8fa 0%, #4fb3e9 100%)',
                      boxShadow: '0 4px 16px rgba(90, 200, 250, 0.3)',
                      border: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4fb3e9 0%, #3ea5e0 100%)',
                        boxShadow: '0 6px 20px rgba(90, 200, 250, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
{loading ? <CircularProgress size={24} color="inherit" /> : t('auth.createAccount', 'アカウント作成')}
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 2, fontSize: '0.8rem' }}
          >
{t('auth.agreement', 'ログインにより、利用規約とプライバシーポリシーに同意するものとします')}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};