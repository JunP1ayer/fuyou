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
import { evaluatePasswordStrength } from '../../lib/passwordStrength';
import simpleSupabase from '../../lib/simpleSupabase';
import { EmailConfirmationScreen } from './EmailConfirmationScreen';

export const SimpleAuthForm: React.FC = () => {
  const { 
    login, 
    signup, 
    loading, 
    showEmailConfirmation, 
    registeredEmail, 
    setShowEmailConfirmation, 
    setRegisteredEmail 
  } = useSimpleAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  // 状態変化の追跡
  React.useEffect(() => {
    console.log('🔍 showEmailConfirmation changed:', showEmailConfirmation);
    console.log('🔍 registeredEmail changed:', registeredEmail);
  }, [showEmailConfirmation, registeredEmail]);

  React.useEffect(() => {
    console.log('🔍 SimpleAuthForm component mounted/remounted');
    return () => {
      console.log('🔍 SimpleAuthForm component unmounting');
    };
  }, []);

  // フォーム状態
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const strength = evaluatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('🔐 ===== FORM SUBMISSION START =====');
    console.log('🔐 Mode:', mode);
    console.log('🔐 Email:', formData.email);
    console.log('🔐 showEmailConfirmation state before:', showEmailConfirmation);

    try {
      if (mode === 'login') {
        console.log('🔐 Executing login...');
        await login(formData.email, formData.password);
        console.log('🔐 Login completed');
      } else {
        console.log('🔐 Executing signup...');
        const result = await signup(formData.email, formData.password, formData.name);
        console.log('🔐 ===== SIGNUP RESULT =====');
        console.log('🔐 Signup result:', JSON.stringify(result, null, 2));
        console.log('🔐 needsEmailConfirmation:', result.needsEmailConfirmation);
        
        // サインアップ成功時はメール確認画面を表示
        if (result.needsEmailConfirmation) {
          console.log('📧 SHOULD SHOW EMAIL CONFIRMATION - setting states...');
          setRegisteredEmail(formData.email);
          setShowEmailConfirmation(true);
          console.log('📧 States set - registeredEmail:', formData.email);
          console.log('📧 States set - showEmailConfirmation: true');
        } else {
          console.log('✅ No email confirmation required - user logged in automatically');
        }
        console.log('🔐 ===== SIGNUP FLOW COMPLETE =====');
      }
    } catch (error: any) {
      console.log('🔐 ===== ERROR OCCURRED =====');
      console.log('🔐 Error:', error);
      const errorMessage = error.message || '認証に失敗しました';
      setError(errorMessage);
      
      // 既に登録済みの場合の処理
      if (mode === 'signup' && errorMessage.includes('既に登録済み')) {
        setIsAlreadyRegistered(true);
        // 3秒後にログインモードに自動切替
        setTimeout(() => {
          setMode('login');
          setIsAlreadyRegistered(false);
          setError(null);
        }, 3000);
      }
    }
  };

  // メール確認画面を表示
  console.log('🔐 ===== RENDER CHECK =====');
  console.log('🔐 showEmailConfirmation:', showEmailConfirmation);
  console.log('🔐 registeredEmail:', registeredEmail);
  console.log('🔐 Should show EmailConfirmationScreen?', showEmailConfirmation);
  
  if (showEmailConfirmation) {
    console.log('📧 RENDERING EmailConfirmationScreen with email:', registeredEmail);
    return (
      <EmailConfirmationScreen
        email={registeredEmail}
        onBackToAuth={() => {
          console.log('📧 Back to auth clicked');
          setShowEmailConfirmation(false);
          setMode('login');
          setFormData({ email: registeredEmail, password: '', name: '' });
        }}
      />
    );
  } else {
    console.log('🔐 RENDERING login/signup form');
  }

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
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 600, whiteSpace: 'nowrap' }}>
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
            <Alert 
              severity={isAlreadyRegistered ? "warning" : "error"} 
              sx={{ mb: 2 }}
            >
              {error}
              {isAlreadyRegistered && (
                <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'warning.main' }}>
                  📱 3秒後にログイン画面に切り替えます...
                </Box>
              )}
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

            {/* パスワード強度（サインアップ時のみ） */}
            {mode === 'signup' && formData.password && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  パスワード強度: {strength.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {[0,1,2,3].map((i) => (
                    <Box key={i} sx={{ height: 6, flex: 1, borderRadius: 9999, background: i < strength.score ? '#5ac8fa' : '#e0e0e0' }} />
                  ))}
                </Box>
              </Box>
            )}

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

            {/* 未確認メール用の再送リンク（ログインモード） */}
            {mode === 'login' && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={async () => {
                    if (!formData.email) {
                      setError('メールアドレスを入力してください');
                      return;
                    }
                    try {
                      await simpleSupabase.auth.resend({ type: 'signup', email: formData.email.trim() });
                      setError(null);
                      alert('確認メールを再送しました。受信ボックスをご確認ください。');
                    } catch (e) {
                      setError('確認メールの再送に失敗しました。時間をおいて再度お試しください。');
                    }
                  }}
                >
                  確認メールを再送する
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};