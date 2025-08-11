// 🔐 シンプル認証フォーム
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';

export const SimpleAuthForm: React.FC = () => {
  const { login, signup, loading } = useSimpleAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.name);
      }
    } catch (error: any) {
      setError(error.message || '認証に失敗しました');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 600 }}>
            扶養管理カレンダー
          </Typography>

          {/* モード切替 */}
          <Box sx={{ display: 'flex', mb: 3, background: '#f5f5f5', borderRadius: 2, p: 0.5 }}>
            <Button
              fullWidth
              onClick={() => setMode('login')}
              sx={{
                py: 1,
                fontWeight: mode === 'login' ? 600 : 400,
                background: mode === 'login' ? '#fff' : 'transparent',
                color: mode === 'login' ? '#1976d2' : '#666',
                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              ログイン
            </Button>
            <Button
              fullWidth
              onClick={() => setMode('signup')}
              sx={{
                py: 1,
                fontWeight: mode === 'signup' ? 600 : 400,
                background: mode === 'signup' ? '#fff' : 'transparent',
                color: mode === 'signup' ? '#1976d2' : '#666',
                boxShadow: mode === 'signup' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              新規登録
            </Button>
          </Box>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* フォーム */}
          <Box component="form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <TextField
                fullWidth
                label="お名前"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
            )}

            <TextField
              fullWidth
              type="email"
              label="メールアドレス"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                mode === 'login' ? 'ログイン' : 'アカウント作成'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};