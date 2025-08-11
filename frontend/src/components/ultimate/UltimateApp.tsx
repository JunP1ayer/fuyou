// 🚀 究極の統合アプリコンポーネント

import React, { useState, useEffect, useCallback } from 'react';
import { Box, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

// 作成したコンポーネントたち
import { createAppTheme } from '../../utils/theme';
import { AccessibilityProvider } from '../accessibility/AccessibilityProvider';
import { KeyboardNavigation } from '../accessibility/KeyboardNavigation';
import { ScreenReaderAnnouncements } from '../accessibility/ScreenReaderAnnouncements';
import { MobileOptimizedApp } from '../common/MobileOptimizedApp';
import { PWAPrompt } from '../pwa/PWAPrompt';
import { VirtualizedCalendar } from '../performance/VirtualizedCalendar';
import { AdvancedGestures } from '../gestures/AdvancedGestures';
import { MicroInteraction, FloatingAnimation, useSoundEffects } from '../animations/MicroInteractions';
import { SmartSuggestions } from '../ai/SmartSuggestions';
import { useAI, usePerformanceLearning } from '../../hooks/useAI';
import { usePWA } from '../../hooks/usePWA';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

// エラーフォールバック
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 3,
      textAlign: 'center',
    }}
  >
    <h1>🚨 エラーが発生しました</h1>
    <pre style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
      {error.message}
    </pre>
    <button onClick={resetErrorBoundary}>
      アプリを再起動
    </button>
  </Box>
);

type ViewType = 'calendar' | 'dashboard' | 'add' | 'settings';

interface UltimateAppProps {
  initialTheme?: 'light' | 'dark';
}

export const UltimateApp: React.FC<UltimateAppProps> = ({ 
  initialTheme = 'light' 
}) => {
  // テーマ状態
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme);
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  
  // デバイス検出
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // カスタムフック
  const { trackAction, getSuggestions } = useAI();
  const { trackPageLoad, trackError } = usePerformanceLearning();
  const { capabilities, installPrompt } = usePWA();
  const { playSuccess, playClick } = useSoundEffects();

  // テーマ作成
  const theme = createAppTheme(themeMode);

  // システム設定に基づく初期テーマ設定
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') as 'light' | 'dark';
    if (savedTheme) {
      setThemeMode(savedTheme);
    } else if (prefersDarkMode) {
      setThemeMode('dark');
    }
  }, [prefersDarkMode]);

  // テーマ切り替え
  const handleThemeToggle = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('theme-mode', newMode);
    trackAction('theme_changed', { mode: newMode });
    playClick();
  }, [themeMode, trackAction, playClick]);

  // ビュー変更
  const handleViewChange = useCallback((view: ViewType) => {
    const startTime = performance.now();
    setCurrentView(view);
    
    // パフォーマンス測定
    setTimeout(() => {
      const loadTime = performance.now() - startTime;
      trackPageLoad(view, loadTime);
    }, 0);
    
    trackAction('view_changed', { from: currentView, to: view });
    playClick();
  }, [currentView, trackPageLoad, trackAction, playClick]);

  // PWAインストール処理
  const handlePWAInstall = useCallback(() => {
    trackAction('pwa_installed', { 
      timestamp: Date.now(),
      capabilities: Object.keys(capabilities).filter(key => capabilities[key as keyof typeof capabilities])
    });
    playSuccess();
  }, [trackAction, capabilities, playSuccess]);

  // エラーハンドリング
  const handleError = useCallback((error: Error) => {
    trackError(error, { view: currentView, timestamp: Date.now() });
  }, [trackError, currentView]);

  // 日付クリック処理（仮想カレンダー用）
  const handleDateClick = useCallback((date: string) => {
    trackAction('date_clicked', { date, view: currentView });
    console.log('Date selected:', date);
  }, [trackAction, currentView]);

  // スマート提案受け入れ処理
  const handleSuggestionAccepted = useCallback((suggestion: any) => {
    trackAction('suggestion_accepted', {
      type: suggestion.type,
      confidence: suggestion.confidence,
      timestamp: Date.now(),
    });
    playSuccess();
  }, [trackAction, playSuccess]);

  // レンダー内容
  const renderMainContent = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <AdvancedGestures
            enablePinchZoom
            enableRotation={false}
            enable3DTouch
            onPinch={(scale) => console.log('Calendar zoom:', scale)}
            on3DTouch={(pressure, pos) => console.log('3D Touch:', pressure, pos)}
          >
            <VirtualizedCalendar onDateClick={handleDateClick} />
          </AdvancedGestures>
        );
      
      case 'dashboard':
        return (
          <Box sx={{ p: 2 }}>
            <FloatingAnimation duration={4} distance={15}>
              <SmartSuggestions 
                maxSuggestions={3}
                onSuggestionAccepted={handleSuggestionAccepted}
              />
            </FloatingAnimation>
          </Box>
        );
      
      case 'settings':
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <MicroInteraction
              type="button"
              soundEffect
              hapticFeedback
              glowEffect
              particleEffect
              onClick={handleThemeToggle}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                🎨 テーマ切り替え ({themeMode})
              </Box>
            </MicroInteraction>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ 
            p: 3, 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            <Box>
              <h2>🚀 究極の扶養管理アプリ</h2>
              <p>すべての機能が統合された最高のユーザーエクスペリエンス</p>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  '⚡ パフォーマンス最適化',
                  '♿ アクセシビリティ対応',
                  '📱 PWA機能',
                  '🤖 AI/ML統合',
                  '🤏 高度ジェスチャー',
                  '✨ マイクロインタラクション',
                ].map((feature) => (
                  <MicroInteraction
                    key={feature}
                    type="card"
                    soundEffect
                    hapticFeedback
                    glowEffect
                  >
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 1,
                        minWidth: 200,
                      }}
                    >
                      {feature}
                    </Box>
                  </MicroInteraction>
                ))}
              </Box>
            </Box>
          </Box>
        );
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AccessibilityProvider>
          <KeyboardNavigation>
            <ScreenReaderAnnouncements>
              <Box
                sx={{
                  minHeight: '100vh',
                  backgroundColor: 'background.default',
                  color: 'text.primary',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* メインアプリ */}
                <MobileOptimizedApp
                  currentView={currentView}
                  onViewChange={handleViewChange}
                >
                  {renderMainContent()}
                </MobileOptimizedApp>

                {/* PWAインストールプロンプト */}
                <PWAPrompt onInstall={handlePWAInstall} />

                {/* トースト通知 */}
                <Toaster
                  position={isMobile ? "bottom-center" : "top-right"}
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      borderRadius: '12px',
                      boxShadow: theme.shadows[8],
                    },
                    success: {
                      iconTheme: {
                        primary: theme.palette.success.main,
                        secondary: 'white',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: theme.palette.error.main,
                        secondary: 'white',
                      },
                    },
                  }}
                />

                {/* デバッグ情報（開発時のみ） */}
                {process.env.NODE_ENV === 'development' && (
                  <Box
                    sx={{
                      position: 'fixed',
                      bottom: isMobile ? 80 : 10,
                      left: 10,
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      zIndex: 9999,
                      maxWidth: 200,
                    }}
                  >
                    <div>View: {currentView}</div>
                    <div>Theme: {themeMode}</div>
                    <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
                    <div>PWA: {capabilities.isInstalled ? 'Installed' : 'Web'}</div>
                    <div>Online: {capabilities.isOnline ? 'Yes' : 'No'}</div>
                  </Box>
                )}
              </Box>
            </ScreenReaderAnnouncements>
          </KeyboardNavigation>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};