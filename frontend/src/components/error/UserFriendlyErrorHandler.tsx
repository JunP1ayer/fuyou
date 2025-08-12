/**
 * ユーザーフレンドリーなエラーハンドリングコンポーネント
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  Collapse,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Feedback as FeedbackIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

// エラータイプの定義
export type ErrorType = 'network' | 'validation' | 'auth' | 'permission' | 'server' | 'unknown';
export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

export interface UserError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  technicalMessage?: string;
  suggestions?: string[];
  actions?: ErrorAction[];
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

/**
 * エラーメッセージの日本語化
 */
const getLocalizedErrorMessage = (error: Error | string, type?: ErrorType): UserError => {
  const errorString = typeof error === 'string' ? error : error.message;
  const id = Date.now().toString();
  const timestamp = new Date();

  // ネットワークエラー
  if (type === 'network' || errorString.includes('fetch') || errorString.includes('network')) {
    return {
      id,
      type: 'network',
      severity: 'error',
      title: 'ネットワークエラー',
      message: 'インターネット接続を確認してください。',
      technicalMessage: errorString,
      suggestions: [
        'インターネット接続を確認してください',
        '少し時間をおいて再試行してください',
        'WiFiまたはモバイルデータを切り替えてください'
      ],
      actions: [
        {
          label: '再試行',
          action: () => window.location.reload(),
          variant: 'contained',
          color: 'primary'
        }
      ],
      timestamp
    };
  }

  // 認証エラー
  if (type === 'auth' || errorString.includes('auth') || errorString.includes('unauthorized')) {
    return {
      id,
      type: 'auth',
      severity: 'warning',
      title: '認証エラー',
      message: 'ログインが必要です。再度ログインしてください。',
      technicalMessage: errorString,
      suggestions: [
        '再度ログインしてください',
        'パスワードを確認してください',
        'アカウントがロックされていないか確認してください'
      ],
      actions: [
        {
          label: 'ログインページへ',
          action: () => { window.location.href = '/login'; },
          variant: 'contained',
          color: 'warning'
        }
      ],
      timestamp
    };
  }

  // バリデーションエラー
  if (type === 'validation') {
    return {
      id,
      type: 'validation',
      severity: 'warning',
      title: '入力エラー',
      message: '入力内容に問題があります。確認して修正してください。',
      technicalMessage: errorString,
      suggestions: [
        '必要な項目がすべて入力されているか確認してください',
        '入力形式が正しいか確認してください',
        '文字数制限を確認してください'
      ],
      timestamp
    };
  }

  // サーバーエラー
  if (type === 'server' || errorString.includes('500') || errorString.includes('server')) {
    return {
      id,
      type: 'server',
      severity: 'error',
      title: 'サーバーエラー',
      message: 'サーバーで問題が発生しました。しばらく時間をおいて再試行してください。',
      technicalMessage: errorString,
      suggestions: [
        'しばらく時間をおいて再試行してください',
        '問題が続く場合はサポートにお問い合わせください'
      ],
      actions: [
        {
          label: '再試行',
          action: () => window.location.reload(),
          variant: 'outlined',
          color: 'primary'
        },
        {
          label: 'サポートに連絡',
          action: () => { window.open('mailto:support@example.com'); },
          variant: 'text',
          color: 'secondary'
        }
      ],
      timestamp
    };
  }

  // デフォルト（不明なエラー）
  return {
    id,
    type: 'unknown',
    severity: 'error',
    title: '予期しないエラー',
    message: '予期しないエラーが発生しました。',
    technicalMessage: errorString,
    suggestions: [
      'ページを再読み込みしてください',
      '問題が続く場合はサポートにお問い合わせください'
    ],
    actions: [
      {
        label: '再読み込み',
        action: () => window.location.reload(),
        variant: 'contained',
        color: 'primary'
      }
    ],
    timestamp
  };
};

/**
 * エラートースト通知
 */
export const ErrorToast: React.FC<{
  error: UserError | null;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}> = ({ error, open, onClose, autoHideDuration = 6000 }) => {
  const getIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      case 'success': return <SuccessIcon />;
      default: return <InfoIcon />;
    }
  };

  if (!error) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={error.severity}
        onClose={onClose}
        icon={getIcon(error.severity)}
        sx={{ minWidth: 300 }}
      >
        <AlertTitle>{error.title}</AlertTitle>
        {error.message}
      </Alert>
    </Snackbar>
  );
};

/**
 * 詳細エラーダイアログ
 */
export const ErrorDialog: React.FC<{
  error: UserError | null;
  open: boolean;
  onClose: () => void;
}> = ({ error, open, onClose }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleReportError = useCallback(async () => {
    if (!error) return;
    
    setIsReporting(true);
    try {
      // エラーレポート送信のロジック
      const reportData = {
        error: error.technicalMessage,
        type: error.type,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
        context: error.context
      };

      // 実際の実装では適切なAPIエンドポイントに送信
      console.log('Error reported:', reportData);
      
      // 成功メッセージを表示
      alert('エラーレポートを送信しました。ありがとうございます。');
    } catch (e) {
      alert('エラーレポートの送信に失敗しました。');
    } finally {
      setIsReporting(false);
    }
  }, [error]);

  if (!error) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {error.severity === 'error' && <ErrorIcon color="error" />}
        {error.severity === 'warning' && <WarningIcon color="warning" />}
        {error.severity === 'info' && <InfoIcon color="info" />}
        {error.severity === 'success' && <SuccessIcon color="success" />}
        {error.title}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {error.message}
        </Typography>

        {error.suggestions && error.suggestions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              解決方法
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {error.suggestions.map((suggestion, index) => (
                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                  <Typography variant="body2">{suggestion}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {error.technicalMessage && (
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => setShowTechnical(!showTechnical)}
              startIcon={showTechnical ? <ExpandLess /> : <ExpandMore />}
              variant="text"
              size="small"
            >
              技術的詳細
            </Button>
            <Collapse in={showTechnical}>
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}
              >
                {error.technicalMessage}
              </Box>
            </Collapse>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          発生時刻: {error.timestamp.toLocaleString()}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
        <Button
          onClick={handleReportError}
          disabled={isReporting}
          startIcon={<BugReportIcon />}
          variant="outlined"
          size="small"
        >
          {isReporting ? 'レポート送信中...' : 'エラーレポート'}
        </Button>

        <Button
          onClick={() => window.open('mailto:support@example.com')}
          startIcon={<FeedbackIcon />}
          variant="outlined"
          size="small"
        >
          サポートに連絡
        </Button>

        {error.actions?.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            variant={action.variant || 'text'}
            color={action.color || 'primary'}
            size="small"
          >
            {action.label}
          </Button>
        ))}

        <Button onClick={onClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * インライン エラー表示
 */
export const InlineError: React.FC<{
  error: UserError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}> = ({ error, onRetry, onDismiss, compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert
      severity={error.severity}
      onClose={onDismiss || (() => setDismissed(true))}
      sx={{ mb: 2 }}
    >
      {!compact && <AlertTitle>{error.title}</AlertTitle>}
      {error.message}
      
      {(onRetry || error.actions) && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          {onRetry && (
            <Button
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              再試行
            </Button>
          )}
          
          {error.actions?.map((action, index) => (
            <Button
              key={index}
              size="small"
              onClick={action.action}
              variant={action.variant}
              color={action.color}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </Alert>
  );
};

/**
 * エラーハンドリングのカスタムフック
 */
export const useErrorHandler = () => {
  const [errors, setErrors] = useState<UserError[]>([]);
  const [currentError, setCurrentError] = useState<UserError | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const addError = useCallback((error: Error | string, type?: ErrorType, context?: Record<string, any>) => {
    const userError = getLocalizedErrorMessage(error, type);
    if (context) {
      userError.context = context;
    }

    setErrors(prev => [...prev, userError]);
    setCurrentError(userError);
    
    // 重要度に応じて表示方法を決定
    if (userError.severity === 'error') {
      setShowDialog(true);
    } else {
      setShowToast(true);
    }
  }, []);

  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
    if (currentError?.id === errorId) {
      setCurrentError(null);
      setShowDialog(false);
      setShowToast(false);
    }
  }, [currentError]);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
    setShowDialog(false);
    setShowToast(false);
  }, []);

  // グローバルエラーハンドラーの設定
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      addError(event.error || event.message, 'unknown');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError(event.reason, 'unknown');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addError]);

  return {
    errors,
    currentError,
    addError,
    clearError,
    clearAllErrors,
    showDialog,
    setShowDialog,
    showToast,
    setShowToast,
  };
};

/**
 * エラーバウンダリー付きのエラーハンドラー
 */
export const ErrorHandlerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    currentError,
    showDialog,
    setShowDialog,
    showToast,
    setShowToast,
    clearError,
  } = useErrorHandler();

  return (
    <>
      {children}
      
      <ErrorToast
        error={currentError}
        open={showToast}
        onClose={() => {
          setShowToast(false);
          if (currentError) {
            clearError(currentError.id);
          }
        }}
      />
      
      <ErrorDialog
        error={currentError}
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          if (currentError) {
            clearError(currentError.id);
          }
        }}
      />
    </>
  );
};

/**
 * リトライ機能付きのローディング状態管理
 */
export const useRetryableOperation = <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<UserError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { addError } = useErrorHandler();

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setRetryCount(0);
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      const userError = getLocalizedErrorMessage(errorMessage, 'unknown');
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          execute();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError(userError);
        addError(errorMessage, 'unknown');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [operation, retryCount, maxRetries, retryDelay, addError]);

  const retry = useCallback(() => {
    setRetryCount(0);
    execute();
  }, [execute]);

  return {
    execute,
    retry,
    isLoading,
    error,
    retryCount,
    canRetry: retryCount < maxRetries,
  };
};