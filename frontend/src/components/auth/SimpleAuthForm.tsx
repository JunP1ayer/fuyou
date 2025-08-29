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
  let authContext;
  try {
    authContext = useSimpleAuth();
  } catch (contextError) {
    console.error('🔐 Auth context error:', contextError);
    // コンテキストエラーの場合はエラー表示
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          認証システムエラー
        </Typography>
        <Typography variant="body1" color="text.secondary">
          認証コンテキストの初期化に失敗しました。ページを再読み込みしてください。
        </Typography>
      </Box>
    );
  }
  
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
  } = authContext;
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

  // 全てのHooksをコンポーネントのトップレベルで定義（条件分岐の前に）
  // スクロール無効化用useEffect
  React.useEffect(() => {
    const shouldDisableScroll = selectedAuthMethod === 'email' || showExistingUserConfirm || (!showMethodSelection && !selectedAuthMethod);
    
    if (shouldDisableScroll) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedAuthMethod, showMethodSelection, showExistingUserConfirm]);

  // 認証方法選択のハンドラ
  const handleSelectGoogleAuth = () => {
    console.log('🔐 Selected Google authentication');
    
    // ローカル開発時は即座にエラーメッセージ表示（UIを変更しない）
    if (window.location.hostname === 'localhost') {
      setError('ローカル開発時はGoogle認証は無効です。デモ認証をお使いください。');
      return;
    }
    
    // 状態を一括で更新してちらつきを完全に防ぐ
    React.startTransition(() => {
      setSelectedAuthMethod('google');
      setGoogleLoading(true);
      setShowMethodSelection(false);
      setError(null); // エラーもクリア
    });
    
    // Googleログインを実行（非同期）
    setTimeout(async () => {
      await handleGoogleLogin();
    }, 0); // 次のTickで実行
  };

  const handleSelectEmailAuth = () => {
    console.log('🔐 Selected Email authentication');
    try {
      setSelectedAuthMethod('email');
      setShowMethodSelection(false);
      setError(null); // エラーをクリア
    } catch (error) {
      console.error('🔐 Error selecting email auth:', error);
      setError('メール認証選択中にエラーが発生しました。再度お試しください。');
    }
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
    
    // ローカル開発時はGoogle認証を無効化
    if (window.location.hostname === 'localhost') {
      console.log('🔐 Google login disabled in local development');
      setError('ローカル開発時はGoogle認証は無効です。デモ認証をお使いください。');
      setGoogleLoading(false);
      setShowMethodSelection(true);
      return;
    }
    
    try {
      console.log('🔐 Attempting OAuth with redirect URL:', `${window.location.origin}/auth/callback`);
      
      const { data, error } = await simpleSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // アカウント選択を強制表示
            // hd: 'gmail.com', // 特定ドメインに制限する場合
          },
        },
      });

      if (error) {
        console.error('🔐 Google OAuth error:', error);
        setError(`Googleログインエラー: ${error.message}`);
        setGoogleLoading(false);
        setShowMethodSelection(true);
        setSelectedAuthMethod(null);
        return;
      }

      if (data?.url) {
        console.log('🔐 OAuth redirect URL received:', data.url);
        console.log('🔐 Redirecting to Google OAuth...');
        
        // ユーザーをGoogleの認証ページにリダイレクト
        window.location.href = data.url;
        
        // リダイレクト後はローディング状態を維持
        // (ページが変わるのでsetGoogleLoading(false)は不要)
        
      } else {
        console.error('🔐 No redirect URL received from OAuth');
        setError('Googleログインの設定に問題があります。');
        setGoogleLoading(false);
        setShowMethodSelection(true);
        setSelectedAuthMethod(null);
      }
    } catch (error: any) {
      console.error('🔐 Google login failed:', error);
      setError(`認証エラー: ${error.message || '不明なエラーが発生しました'}`);
      setGoogleLoading(false);
      setShowMethodSelection(true);
      setSelectedAuthMethod(null);
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
      console.log('🔐 Error type:', typeof error);
      console.log('🔐 Error message:', error?.message);
      console.log('🔐 Error stack:', error?.stack);
      
      let errorMessage = '予期しないエラーが発生しました。再度お試しください。';
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      }
      
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
  
  // Googleログイン処理中の表示（最優先）
  if (selectedAuthMethod === 'google' && googleLoading) {
    console.log('🔄 RENDERING Google Login Loading Screen');
    
    // ボディのスクロールを無効化
    React.useEffect(() => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }, []);
    
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          zIndex: 9999,
          overflow: 'hidden !important', // スクロール禁止を強制
          overflowX: 'hidden !important',
          overflowY: 'hidden !important',
          px: 2,
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 400, 
            width: '100%', 
            borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden', // カード内スクロールも禁止
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Googleアイコン */}
            <Box sx={{ mb: 3 }}>
              <Google 
                sx={{ 
                  fontSize: 56, 
                  color: '#4285F4', 
                  mb: 1,
                  filter: 'drop-shadow(0 2px 8px rgba(66, 133, 244, 0.3))' 
                }} 
              />
            </Box>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: '#3c4043',
                fontSize: '1.3rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Googleでログイン中
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 3, 
                lineHeight: 1.4,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              アカウント選択ページに移動中...
            </Typography>

            <CircularProgress 
              size={32} 
              sx={{ 
                color: '#4285F4',
                mb: 3
              }} 
            />

            {/* エラー表示 */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {error}
              </Alert>
            )}
            
            {/* キャンセルボタン */}
            <Button
              onClick={handleBackToSelection}
              variant="outlined"
              size="small"
              sx={{
                px: 3,
                py: 1,
                borderColor: '#dadce0',
                color: '#3c4043',
                fontSize: '0.875rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#d2d6da',
                  background: '#f8f9fa',
                },
              }}
            >
              キャンセル
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // メール確認画面を表示
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
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          overflow: 'hidden !important', // スクロール禁止を強制
          overflowX: 'hidden !important',
          overflowY: 'hidden !important',
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        overflow: 'hidden', // スクロール禁止
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

          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};