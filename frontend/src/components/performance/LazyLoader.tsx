/**
 * 遅延読み込み・パフォーマンス最適化コンポーネント
 */

import React, { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import { ErrorBoundary } from '../ErrorBoundary';

// 仮想化リスト用のインポート
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { memo } from 'react';

/**
 * コンポーネントの遅延読み込み
 */
export const createLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <ErrorBoundary>
      <Suspense fallback={fallback || <ComponentLoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * コンポーネント読み込み中のスケルトン
 */
export const ComponentLoadingSkeleton: React.FC<{
  variant?: 'card' | 'list' | 'form' | 'calendar';
  count?: number;
}> = ({ variant = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={200} />
            <Box sx={{ pt: 2 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Box>
          </Box>
        );
        
      case 'list':
        return (
          <Box>
            {Array.from({ length: 5 }, (_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </Box>
              </Box>
            ))}
          </Box>
        );
        
      case 'form':
        return (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton width="30%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={56} />
              </Box>
            ))}
          </Box>
        );
        
      case 'calendar':
        return (
          <Box sx={{ p: 2 }}>
            <Skeleton width="50%" height={40} sx={{ mb: 2, mx: 'auto' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {Array.from({ length: 35 }, (_, i) => (
                <Skeleton key={i} variant="rectangular" height={60} />
              ))}
            </Box>
          </Box>
        );
        
      default:
        return <Skeleton variant="rectangular" width="100%" height={200} />;
    }
  };

  return (
    <Box>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i}>{renderSkeleton()}</Box>
      ))}
    </Box>
  );
};

/**
 * 画像の遅延読み込み
 */
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, width, height, placeholder, onLoad, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer で画面に入ったときだけ読み込み
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.100',
        position: 'relative',
      }}
    >
      {isInView && !hasError && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isLoading ? 'none' : 'block',
            }}
          />
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </>
      )}
      
      {(!isInView || hasError) && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.200',
          }}
        >
          {hasError ? (
            <Typography variant="caption" color="text.secondary">
              読み込みエラー
            </Typography>
          ) : (
            placeholder || <Skeleton variant="rectangular" width="100%" height="100%" />
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * 仮想化リストコンポーネント
 */
export interface VirtualListItem {
  id: string | number;
  height?: number;
}

export const VirtualizedList: React.FC<{
  items: VirtualListItem[];
  renderItem: (item: VirtualListItem, index: number) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  height: number;
  width?: number | string;
  overscan?: number;
}> = memo(({ items, renderItem, itemHeight = 60, height, width = '100%', overscan = 5 }) => {
  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ));

  if (typeof itemHeight === 'number') {
    return (
      <List
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscan}
      >
        {Row}
      </List>
    );
  } else {
    return (
      <VariableSizeList
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscan}
      >
        {Row}
      </VariableSizeList>
    );
  }
});

/**
 * データの遅延読み込み（無限スクロール）
 */
export const InfiniteScroll: React.FC<{
  children: React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
}> = ({ children, loadMore, hasMore, loading, threshold = 200 }) => {
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async () => {
    if (isFetching || loading || !hasMore) return;
    
    setIsFetching(true);
    try {
      await loadMore();
    } finally {
      setIsFetching(false);
    }
  }, [loadMore, hasMore, loading, isFetching]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !isFetching) {
          handleLoadMore();
        }
      },
      { threshold: 0, rootMargin: `${threshold}px` }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loading, isFetching, threshold]);

  return (
    <Box>
      {children}
      
      <div ref={sentinelRef} style={{ height: 1 }} />
      
      {(loading || isFetching) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {!hasMore && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            これ以上データはありません
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * コンポーネントのメモ化ヘルパー
 */
export const memoWithProps = <T extends Record<string, any>>(
  Component: React.FC<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) => {
  return memo(Component, propsAreEqual);
};

/**
 * 重い計算の遅延実行
 */
export const useDeferredCalculation = <T,>(
  calculate: () => T,
  deps: React.DependencyList,
  delay: number = 100
): T | undefined => {
  const [result, setResult] = useState<T | undefined>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const newResult = calculate();
        setResult(newResult);
      } catch (error) {
        console.error('Deferred calculation error:', error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);

  return result;
};

/**
 * リソースプリローダー
 */
export const useResourcePreloader = () => {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadComponent = useCallback(async (
    importFunc: () => Promise<any>
  ): Promise<void> => {
    try {
      await importFunc();
    } catch (error) {
      console.error('Component preload failed:', error);
    }
  }, []);

  const preloadData = useCallback(async (
    fetchFunc: () => Promise<any>
  ): Promise<any> => {
    try {
      return await fetchFunc();
    } catch (error) {
      console.error('Data preload failed:', error);
      return null;
    }
  }, []);

  return {
    preloadImage,
    preloadComponent,
    preloadData,
  };
};

/**
 * バンドル分割された遅延コンポーネント群
 */
export const LazyComponents = {
  // 重いコンポーネントを遅延読み込み
  Dashboard: createLazyComponent(
    () => import('../dashboard/EarningsDashboard'),
    <ComponentLoadingSkeleton variant="card" />
  ),
  
  Calendar: createLazyComponent(
    () => import('../calendar/CalendarApp'),
    <ComponentLoadingSkeleton variant="calendar" />
  ),
  
  Settings: createLazyComponent(
    () => import('../settings/SettingsView'),
    <ComponentLoadingSkeleton variant="form" />
  ),
  
  Banking: createLazyComponent(
    () => import('../banking/BankingDashboard'),
    <ComponentLoadingSkeleton variant="list" />
  ),
};

/**
 * パフォーマンス監視Hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16.67) { // 60fps基準
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms (>16.67ms)`);
      }
      
      // Performance API に記録
      if ('mark' in performance && 'measure' in performance) {
        try {
          performance.mark(`${componentName}-render-end`);
          performance.measure(
            `${componentName}-render`,
            `${componentName}-render-start`,
            `${componentName}-render-end`
          );
        } catch (e) {
          // Ignore performance API errors
        }
      }
    };
  });
  
  useEffect(() => {
    if ('mark' in performance) {
      try {
        performance.mark(`${componentName}-render-start`);
      } catch (e) {
        // Ignore performance API errors
      }
    }
  }, [componentName]);
};