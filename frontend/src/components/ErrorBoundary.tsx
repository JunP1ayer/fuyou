// 🛡️ エラーバウンダリ - アプリ全体のエラーハンドリング

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import { 
  ErrorOutline, 
  Refresh, 
  BugReport, 
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // エラー報告（プロダクションではサーバに送信）
    import('../utils/errorReporter').then(({ reportClientError }) => {
      reportClientError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }, 'error');
    });
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 互換のため残すが、実送信は componentDidCatch で行う
    // 開発時のみ簡易ログ
    if (process.env.NODE_ENV !== 'production') {
      console.log('Error reported (dev):', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('NetworkError') || 
                            this.state.error?.message?.includes('fetch');
      const isQuotaError = this.state.error?.message?.includes('QuotaExceeded');

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            backgroundColor: '#f5f5f5',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ maxWidth: 500, width: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <ErrorOutline 
                  sx={{ 
                    fontSize: 64, 
                    color: 'error.main', 
                    mb: 2 
                  }} 
                />
                
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  申し訳ございません
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {isNetworkError 
                    ? 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
                    : isQuotaError
                    ? 'ストレージ容量が不足しています。一部のデータを削除してください。'
                    : '予期しないエラーが発生しました。ページを再読み込みしてください。'
                  }
                </Typography>

                {(isNetworkError || isQuotaError) && (
                  <Alert 
                    severity={isQuotaError ? 'warning' : 'info'} 
                    sx={{ mb: 3, textAlign: 'left' }}
                  >
                    <Typography variant="body2">
                      {isQuotaError 
                        ? '設定→データ管理から不要なデータを削除できます。'
                        : 'オフラインでも一部の機能は利用可能です。'
                      }
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleReload}
                    sx={{ flex: 1 }}
                  >
                    ページ再読み込み
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleRetry}
                    sx={{ flex: 1 }}
                  >
                    再試行
                  </Button>
                </Box>

                <Box>
                  <Button
                    size="small"
                    startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                    sx={{ mb: 1 }}
                  >
                    詳細情報
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Alert severity="error" sx={{ textAlign: 'left', mt: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        <strong>エラー:</strong> {this.state.error?.message}
                        <br />
                        <strong>発生時刻:</strong> {new Date().toLocaleString()}
                      </Typography>
                      {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                          <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
                            {this.state.errorInfo.componentStack}
                          </Typography>
                        </Box>
                      )}
                    </Alert>
                  </Collapse>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  問題が継続する場合は、ブラウザのキャッシュをクリアしてください。
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      );
    }

    return this.props.children;
  }
}

// HOC版エラーバウンダリ
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}