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
  Google,
  ArrowBack,
} from '@mui/icons-material';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';
import { evaluatePasswordStrength } from '../../lib/passwordStrength';
import simpleSupabase from '../../lib/simpleSupabase';
import { EmailConfirmationScreen } from './EmailConfirmationScreen';
import { AuthMethodSelection } from './AuthMethodSelection';

export const SimpleAuthForm: React.FC = () => {
  const { 
    login, 
    signup, 
    loading, 
    showEmailConfirmation, 
    registeredEmail,
    showExistingUserConfirm,
    existingUserEmail,
    existingUserPassword,
    setShowEmailConfirmation, 
    setRegisteredEmail,
    setShowExistingUserConfirm,
    setExistingUserEmail,
    setExistingUserPassword
  } = useSimpleAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [switchingToLogin, setSwitchingToLogin] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMethodSelection, setShowMethodSelection] = useState(true);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<'google' | 'email' | null>(null);

  // 状態変化の追跡
  React.useEffect(() => {
    console.log('🔍 showEmailConfirmation changed:', showEmailConfirmation);
    console.log('🔍 registeredEmail changed:', registeredEmail);
  }, [showEmailConfirmation, registeredEmail]);

  // 状態変化の追跡
  React.useEffect(() => {
    console.log('🚀 autoLoggingIn changed:', autoLoggingIn);
    console.log('🚀 isAlreadyRegistered changed:', isAlreadyRegistered);
    console.log('🚀 showExistingUserConfirm changed:', showExistingUserConfirm);
    console.log('🚀 error:', error);
  }, [autoLoggingIn, isAlreadyRegistered, showExistingUserConfirm, error]);

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

  // 認証方法選択のハンドラ
  const handleSelectGoogleAuth = () => {
    console.log('🔐 Selected Google authentication');
    setSelectedAuthMethod('google');
    setShowMethodSelection(false);
    handleGoogleLogin();
  };

  const handleSelectEmailAuth = () => {
    console.log('🔐 Selected Email authentication');
    setSelectedAuthMethod('email');
    setShowMethodSelection(false);
  };

  // メソッド選択に戻る
  const handleBackToSelection = () => {
    setShowMethodSelection(true);
    setSelectedAuthMethod(null);
    setError(null);
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    console.log('🔐 Google login attempt');
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { data, error } = await simpleSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('🔐 Google login error:', error);
        setError('Googleログインに失敗しました。もう一度お試しください。');
      } else {
        console.log('🔐 Google login redirect initiated');
      }
    } catch (error: any) {
      console.error('🔐 Google login failed:', error);
      setError('Googleログインに失敗しました。もう一度お試しください。');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 自動ログインを実行する関数
  const executeAutoLogin = async () => {
    console.log('🔐 ===== EXECUTE AUTO LOGIN START =====');
    console.log('🔐 existingUserEmail:', `"${existingUserEmail}"`);
    console.log('🔐 existingUserPassword:', existingUserPassword ? `"***" (length: ${existingUserPassword.length})` : 'EMPTY');
    console.log('🔐 showExistingUserConfirm before:', showExistingUserConfirm);
    
    setShowExistingUserConfirm(false);
    setAutoLoggingIn(true);
    setError('自動ログインを開始しています...');
    
    try {
      console.log('🔐 Attempting auto login for existing user');
      console.log('🔐 Using email:', `"${existingUserEmail}"`);
      console.log('🔐 Using password:', existingUserPassword ? 'HAS PASSWORD' : 'NO PASSWORD');
      
      await login(existingUserEmail, existingUserPassword);
      console.log('✅ Auto login successful');
      
      // ログイン成功時はすべての状態をリセット
      setError(null);
      setIsAlreadyRegistered(false);
      setAutoLoggingIn(false);
      setExistingUserEmail('');  // 既存ユーザー情報もクリア
      setExistingUserPassword('');  // 既存ユーザーパスワードもクリア
      
      // フォームデータもクリア（セキュリティ向上）
      setFormData({ email: '', password: '', name: '' });
      
      console.log('🚀 Auto login complete - user should be redirected to main app');
    } catch (loginError: any) {
      console.log('❌ Auto login failed:', loginError);
      console.log('❌ Error message:', loginError.message);
      // ログイン失敗時は通常のログイン画面に切り替え
      setShowExistingUserConfirm(false);
      setMode('login');
      setAutoLoggingIn(false);
      setError('パスワードが正しくありません。ログイン画面でやり直してください。');
      setIsAlreadyRegistered(false);
      // フォームに既存のメールアドレスを設定
      setFormData(prev => ({ ...prev, email: existingUserEmail, password: '', name: '' }));
    }
    
    console.log('🔐 ===== EXECUTE AUTO LOGIN END =====');
  };

  // 既存ユーザー確認をキャンセルする関数
  const cancelAutoLogin = () => {
    console.log('🚀 cancelAutoLogin called');
    setShowExistingUserConfirm(false);
    setMode('login');
    setError(null);
    // フォームに既存のメールアドレスを設定（UX改善）
    setFormData(prev => ({ ...prev, email: existingUserEmail, password: '', name: '' }));
  };

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
        console.log('🔐 isExistingUser:', result.isExistingUser);
        
        if (result.isExistingUser) {
          // 既存ユーザーの場合 - 確認画面を表示
          console.log('⚠️ Existing user detected - showing confirmation');
          console.log('🔐 About to set showExistingUserConfirm to true');
          console.log('🔐 formData.email to save:', `"${formData.email}"`);
          console.log('🔐 formData.password to save:', formData.password ? '***' : 'EMPTY');
          setShowExistingUserConfirm(true);
          setExistingUserEmail(formData.email);  // メールアドレスも保存
          setExistingUserPassword(formData.password);  // パスワードも保存
          setError(null);  // エラー表示をクリア
          console.log('🔐 showExistingUserConfirm should now be true');
          console.log('🔐 existingUserEmail set to:', `"${formData.email}"`);
          console.log('🔐 existingUserPassword saved:', formData.password ? 'YES' : 'NO');
        } else if (result.needsEmailConfirmation) {
          // 新規ユーザーでメール確認が必要
          console.log('📧 SHOULD SHOW EMAIL CONFIRMATION - setting states...');
          setRegisteredEmail(formData.email);
          setShowEmailConfirmation(true);
          setError('確認メールを送信しました。メールボックスをご確認ください。');
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
  console.log('🔐 showExistingUserConfirm:', showExistingUserConfirm);
  console.log('🔐 registeredEmail:', registeredEmail);
  console.log('🔐 Current mode:', mode);
  console.log('🔐 Loading:', loading);
  console.log('🔐 Error:', error);
  
  // デバッグ: 強制的にメール確認画面を表示するテスト用コード（一時的）
  if (showEmailConfirmation && registeredEmail) {
    console.log('📧 RENDERING EmailConfirmationScreen with email:', registeredEmail);
    return (
      <EmailConfirmationScreen
        email={registeredEmail}
        onBackToAuth={() => {
          console.log('📧 Back to auth clicked');
          setShowEmailConfirmation(false);
          handleBackToSelection();
        }}
      />
    );
  }

  // 認証方法選択画面の表示
  if (showMethodSelection) {
    console.log('🎯 RENDERING AuthMethodSelection');
    return (
      <AuthMethodSelection
        onGoogleLogin={handleSelectGoogleAuth}
        onEmailAuth={handleSelectEmailAuth}
        googleLoading={googleLoading}
      />
    );
  }

  // 既存ユーザー確認画面を表示
  if (showExistingUserConfirm) {
    console.log('👤 RENDERING ExistingUserConfirmation with email:', existingUserEmail);
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
        <Card sx={{ maxWidth: 450, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* アイコン */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 1 }}>
                👤
              </Typography>
            </Box>

            {/* タイトル */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              既存アカウントを検出
            </Typography>

            {/* 説明 */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              <strong>{existingUserEmail}</strong>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              は既に登録済みです
            </Typography>


            {/* ボタン */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  console.log('🔵 Auto login button clicked!');
                  executeAutoLogin();
                }}
                disabled={autoLoggingIn}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: '#e3f2fd',
                  color: '#1976d2',
                  boxShadow: 'none',
                  '&:hover': {
                    background: '#bbdefb',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    background: '#f5f5f5',
                    color: '#9e9e9e',
                  }
                }}
              >
                {autoLoggingIn ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} color="inherit" />
                    ログイン中...
                  </Box>
                ) : (
                  'ログイン開始'
                )}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={cancelAutoLogin}
                sx={{ 
                  py: 1.5,
                  fontWeight: 600,
                  borderColor: '#6c757d',
                  color: '#6c757d',
                  '&:hover': {
                    borderColor: '#5a6268',
                    background: '#f8f9fa'
                  }
                }}
              >
                キャンセル
              </Button>
            </Box>

            {/* エラー表示（自動ログイン中のみ） */}
            {autoLoggingIn && error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  console.log('🔐 RENDERING login/signup form');

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
          {/* 戻るボタン */}
          {selectedAuthMethod === 'email' && (
            <Box sx={{ mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBackToSelection}
                variant="text"
                sx={{ color: 'text.secondary' }}
              >
                ログイン方法選択に戻る
              </Button>
            </Box>
          )}

          <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 600, whiteSpace: 'nowrap' }}>
            扶養カレンダー
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

          {/* デバッグ用アラート */}
          {(autoLoggingIn || isAlreadyRegistered) && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              DEBUG: autoLoggingIn={autoLoggingIn ? 'true' : 'false'}, isAlreadyRegistered={isAlreadyRegistered ? 'true' : 'false'}
            </Alert>
          )}

          {/* 既存ユーザー通知（自動ログイン中） */}
          {autoLoggingIn && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, bgcolor: 'primary.light', borderLeft: '4px solid', borderColor: 'primary.main' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  このメールアドレスは既に登録済みです
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 1
              }}>
                <CircularProgress size={18} color="primary" />
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                  🚀 自動ログイン中...お待ちください
                </Typography>
              </Box>
            </Alert>
          )}

          {/* 通常のエラー表示 */}
          {error && !autoLoggingIn && (
            <Alert 
              severity={isAlreadyRegistered ? "warning" : "error"} 
              sx={{ mb: 2 }}
            >
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
              disabled={loading || autoLoggingIn}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {loading || autoLoggingIn ? (
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

            {/* デバッグ用テストボタン */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                デバッグ用テスト
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  console.log('🧪 Manual test: Setting email confirmation screen');
                  setRegisteredEmail('test@example.com');
                  setShowEmailConfirmation(true);
                }}
                sx={{ mr: 1 }}
              >
                メール確認画面テスト
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  console.log('🔍 Current state:', {
                    showEmailConfirmation,
                    registeredEmail,
                    showExistingUserConfirm,
                    mode,
                    loading
                  });
                }}
              >
                状態確認
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};