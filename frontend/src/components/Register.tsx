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
  Link,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    isStudent: true,
  });
  const [formError, setFormError] = useState('');

  const { register, loading, error } = useAuth();

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'isStudent' ? e.target.checked : e.target.value,
      }));
    };

  const validateForm = () => {
    if (
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.fullName.trim()
    ) {
      return '全ての必須項目を入力してください';
    }

    if (!formData.email.includes('@')) {
      return '有効なメールアドレスを入力してください';
    }

    if (formData.password.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'パスワードが一致しません';
    }

    if (formData.fullName.trim().length < 2) {
      return '氏名は2文字以上で入力してください';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        isStudent: formData.isStudent,
      });
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration failed:', error);
    }
  };

  const displayError = formError || error;

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            扶養管理
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            新規登録
          </Typography>

          {displayError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {displayError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="氏名"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            margin="normal"
            required
            autoComplete="name"
            autoFocus
            disabled={loading}
          />

          <TextField
            fullWidth
            label="メールアドレス"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            margin="normal"
            required
            autoComplete="email"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="パスワード"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            margin="normal"
            required
            autoComplete="new-password"
            disabled={loading}
            helperText="8文字以上で入力してください"
          />

          <TextField
            fullWidth
            label="パスワード（確認）"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            margin="normal"
            required
            autoComplete="new-password"
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isStudent}
                onChange={handleInputChange('isStudent')}
                disabled={loading}
              />
            }
            label="学生です"
            sx={{ mt: 1, mb: 1 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            size="large"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '新規登録'
            )}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              既にアカウントをお持ちの方は{' '}
              <Link
                component="button"
                type="button"
                onClick={onSwitchToLogin}
                disabled={loading}
                sx={{ textDecoration: 'none' }}
              >
                ログイン
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
