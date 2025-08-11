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
import type { LoginCredentials, SignupCredentials, AuthError } from '../../types/auth';

interface AuthFormProps {
  defaultTab?: 'login' | 'signup';
  onClose?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  defaultTab = 'login',
  onClose
}) => {
  const theme = useTheme();
  const { login, signup, resetPassword, loading } = useAuth();
  
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
      await login(loginForm);
      onClose?.();
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
    }
  };

  // 登録処理
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signup(signupForm);
      onClose?.();
    } catch (error) {
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
          maxWidth: 400,
          mx: 'auto',
          boxShadow: theme.shadows[10],
          borderRadius: 3,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'primary.contrastText',
            textAlign: 'center',
            py: 3,
            position: 'relative',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            🌟 FUYOU PRO
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            学生向け扶養管理アプリ
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* タブ */}
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 48,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5,
              },
            }}
          >
            <Tab 
              value="login" 
              label="ログイン" 
              icon={<LoginIcon />}
              iconPosition="start"
            />
            <Tab 
              value="signup" 
              label="新規登録" 
              icon={<PersonAdd />}
              iconPosition="start"
            />
          </Tabs>

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
                    label="メールアドレス"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="パスワード"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                    required
                  />

                  <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <Link
                      component="button"
                      type="button"
                      onClick={handlePasswordReset}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      パスワードを忘れた方
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'ログイン'}
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
                    label="お名前"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                    required
                  />

                  <TextField
                    fullWidth
                    type="email"
                    label="メールアドレス"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="パスワード"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="8文字以上、大文字・数字を含む"
                    sx={{ mb: 2 }}
                    required
                  />

                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="パスワード（確認）"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'アカウント作成'}
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ソーシャルログイン（将来の拡張用） */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {[
              { icon: Google, label: 'Google', color: '#db4437' },
              { icon: GitHub, label: 'GitHub', color: '#333' },
              { icon: Apple, label: 'Apple', color: '#000' },
            ].map(({ icon: Icon, label, color }) => (
              <IconButton
                key={label}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  color: color,
                  '&:hover': {
                    backgroundColor: alpha(color, 0.1),
                  },
                }}
                disabled
              >
                <Icon />
              </IconButton>
            ))}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 2 }}
          >
            利用規約とプライバシーポリシーに同意の上、{' '}
            <br />
            {currentTab === 'login' ? 'ログイン' : 'アカウント作成'}してください
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};