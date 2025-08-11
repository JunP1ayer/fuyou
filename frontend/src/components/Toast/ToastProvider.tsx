// 🔔 トースト通知システム - 統一されたユーザーフィードバック

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Slide,
  SlideProps,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface Toast {
  id: string;
  message: string;
  type: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastContextType {
  showToast: (message: string, type?: AlertColor, duration?: number, action?: React.ReactNode) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number, action?: React.ReactNode) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string,
    type: AlertColor = 'info',
    duration = 4000,
    action?: React.ReactNode
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration, action };
    
    setToasts(prev => [...prev, newToast]);

    // 自動削除
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration = 5000, action?: React.ReactNode) => {
    showToast(message, 'error', duration, action);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration = 4000) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration = 4000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideToast,
      clearAll,
    }}>
      {children}
      
      {/* トースト表示 */}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ 
            mb: index * 7, // 複数表示時の間隔
            zIndex: 9999,
          }}
        >
          <Alert
            severity={toast.type}
            variant="filled"
            onClose={() => hideToast(toast.id)}
            action={
              toast.action || (
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => hideToast(toast.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }
            sx={{
              minWidth: 300,
              maxWidth: 400,
              boxShadow: 3,
              '& .MuiAlert-message': {
                wordBreak: 'break-word',
              },
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 便利なヘルパーフック
export const useApiToast = () => {
  const toast = useToast();

  return {
    ...toast,
    apiSuccess: (message: string = '操作が完了しました') => toast.showSuccess(message),
    apiError: (error: any, defaultMessage: string = 'エラーが発生しました') => {
      const message = error?.response?.data?.message || error?.message || defaultMessage;
      toast.showError(message, 6000);
    },
    uploadProgress: (message: string) => toast.showInfo(message, 0), // 手動で閉じる
    csvProcessed: (count: number) => toast.showSuccess(`${count}件の取引を処理しました`),
    ocrProcessed: (shifts: number) => toast.showSuccess(`${shifts}件のシフトを検出しました`),
    savingData: () => toast.showInfo('データを保存中...', 0),
  };
};