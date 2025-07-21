// 透明なデザイントークン自動取得・適用Hook
import { useState, useEffect, useCallback } from 'react';

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, string | number>;
  spacing: Record<string, string>;
  lastUpdated: string;
}

interface UseDesignTokensReturn {
  tokens: DesignTokens | null;
  loading: boolean;
  error: string | null;
  isEnhanced: boolean; // Figma連携による拡張適用中
}

// デフォルトトークン
const defaultTokens: DesignTokens = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    'background-default': '#fafafa',
    'text-primary': 'rgba(0, 0, 0, 0.87)',
  },
  typography: {
    'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
    heading: { 'font-size': '1.5rem', 'font-weight': 500 },
    body: { 'font-size': '0.875rem', 'font-weight': 400 },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  lastUpdated: new Date().toISOString(),
};

export const useDesignTokens = (): UseDesignTokensReturn => {
  const [tokens, setTokens] = useState<DesignTokens>(defaultTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [userId] = useState(
    () => `user_${Math.random().toString(36).substr(2, 9)}`
  ); // 簡易ユーザーID生成

  const fetchDesignTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Gemini式インテリジェントデザイントークン取得
      const response = await fetch('http://localhost:3001/api/design/tokens', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId, // AIコンテキスト分析用
          'User-Agent': navigator.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: デザイントークン取得失敗`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setTokens(result.data);
        setIsEnhanced(!result.fallback); // フォールバックでない場合は拡張適用中

        // CSS変数として自動適用
        applyTokensToDOM(result.data);

        // Gemini式AI分析結果をログ出力
        if (result.intelligence) {
          console.log('🤖 Gemini式AI分析結果:', {
            enhancement: result.enhancement,
            context: result.intelligence.context,
            decision: result.intelligence.decision,
            performance: result.intelligence.performance,
          });

          // パフォーマンストラッキング（Gemini学習用）
          sendPerformanceMetrics(result.intelligence);
        }

        console.log('✅ インテリジェントデザイントークン適用:', {
          enhanced: !result.fallback,
          cached: result.cached,
          lastUpdated: result.data.lastUpdated,
        });
      } else {
        throw new Error('デザイントークンデータが無効です');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知のエラー';
      setError(errorMessage);
      console.warn(
        '⚠️ デザイントークン取得失敗、デフォルト使用:',
        errorMessage
      );

      // エラー時はデフォルトトークン使用
      setTokens(defaultTokens);
      setIsEnhanced(false);
      applyTokensToDOM(defaultTokens);
    } finally {
      setLoading(false);
    }
  }, [userId, sendPerformanceMetrics]);

  // DOM要素にCSS変数として自動適用
  const applyTokensToDOM = (designTokens: DesignTokens) => {
    const root = document.documentElement;

    // 色彩適用
    Object.entries(designTokens.colors).forEach(([key, value]) => {
      root.style.setProperty(`--design-color-${key}`, value);
    });

    // スペーシング適用
    Object.entries(designTokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--design-spacing-${key}`, value);
    });

    // タイポグラフィ適用
    if (designTokens.typography['font-family']) {
      root.style.setProperty(
        '--design-font-family',
        designTokens.typography['font-family']
      );
    }

    // Material-UI テーマカスタマイゼーション用
    root.style.setProperty(
      '--mui-palette-primary-main',
      designTokens.colors.primary
    );
    root.style.setProperty(
      '--mui-palette-secondary-main',
      designTokens.colors.secondary || designTokens.colors.primary
    );
    root.style.setProperty(
      '--mui-palette-success-main',
      designTokens.colors.success
    );
    root.style.setProperty(
      '--mui-palette-warning-main',
      designTokens.colors.warning
    );
    root.style.setProperty(
      '--mui-palette-error-main',
      designTokens.colors.error
    );
  };

  // Gemini式パフォーマンス計測＆学習データ送信
  const sendPerformanceMetrics = useCallback(
    async (intelligence: Record<string, unknown>) => {
      try {
        // 簡易パフォーマンス計測
        const performanceEntry = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const loadTime = performanceEntry
          ? performanceEntry.loadEventEnd - performanceEntry.fetchStart
          : 0;

        await fetch('http://localhost:3001/api/intelligence/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            metrics: {
              taskTime: loadTime,
              errors: 0, // 簡易版では0固定
              totalActions: 1,
              satisfaction: 0.8, // デフォルト満足度
              accessibility: {
                highContrast: window.matchMedia('(prefers-contrast: high)')
                  .matches,
                reducedMotion: window.matchMedia(
                  '(prefers-reduced-motion: reduce)'
                ).matches,
              },
            },
            context: intelligence.context,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.warn('📊 パフォーマンス計測送信エラー:', error);
      }
    },
    [userId]
  );

  // ユーザー行動トラッキング（Gemini学習用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const trackUserBehavior = (
    action: string,
    element: string,
    metadata = {}
  ) => {
    fetch('http://localhost:3001/api/intelligence/behavior', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action, // 'click', 'scroll', 'focus', 'error', 'complete'
        element, // 'button-primary', 'form-input', 'card-content'
        timestamp: Date.now(),
        metadata,
      }),
    }).catch(error => {
      console.warn('📊 行動トラッキング送信エラー:', error);
    });
  };

  // 初回ロード時とタブフォーカス時に自動更新
  useEffect(() => {
    fetchDesignTokens();

    // 5分間隔での自動更新（バックグラウンド同期）
    const interval = setInterval(fetchDesignTokens, 5 * 60 * 1000);

    // タブフォーカス時の更新
    const handleFocus = () => {
      fetchDesignTokens();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDesignTokens]);

  return {
    tokens,
    loading,
    error,
    isEnhanced,
  };
};
