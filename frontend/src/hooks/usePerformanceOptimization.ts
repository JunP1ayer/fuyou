// 🚀 パフォーマンス最適化フック

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { debounce, throttle } from 'lodash-es';

// 遅延読み込みフック
export const useLazyLoad = <T>(
  loadFn: () => Promise<T>,
  dependencies: any[] = [],
  delay: number = 100
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedLoad = useCallback(
    debounce(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loadFn();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, delay),
    [loadFn, delay]
  );

  useEffect(() => {
    debouncedLoad();
    return () => debouncedLoad.cancel();
  }, dependencies);

  return { data, loading, error, reload: debouncedLoad };
};

// メモ化されたコンポーネント計算フック
export const useMemoizedComputation = <T>(
  computeFn: () => T,
  dependencies: any[],
  isExpensive: boolean = false
) => {
  const memoizedValue = useMemo(() => {
    if (isExpensive) {
      console.time('Expensive computation');
      const result = computeFn();
      console.timeEnd('Expensive computation');
      return result;
    }
    return computeFn();
  }, dependencies);

  return memoizedValue;
};

// スクロール最適化フック
export const useOptimizedScroll = (
  callback: (scrollTop: number, isScrolling: boolean) => void,
  throttleMs: number = 16
) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    throttle((scrollTop: number) => {
      setIsScrolling(true);
      callback(scrollTop, true);

      // スクロール終了検出
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        callback(scrollTop, false);
      }, 150);
    }, throttleMs),
    [callback, throttleMs]
  );

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { throttledCallback, isScrolling };
};

// 画像遅延読み込みフック
export const useImageLazyLoad = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              setLoadedImages(prev => new Set(prev).add(src));
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const registerImage = useCallback((element: HTMLImageElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return { registerImage, loadedImages };
};

// リソース使用量監視フック
export const useResourceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    fps: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // メモリ使用量取得（対応ブラウザのみ）
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? 
          Math.round(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit * 100) : 0;

        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage,
          renderTime: currentTime - lastTime,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return metrics;
};

// バックグラウンドタスク実行フック
export const useBackgroundTask = () => {
  const taskQueueRef = useRef<(() => void)[]>([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (isProcessingRef.current || taskQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    const processNextTask = (deadline: IdleDeadline) => {
      while (deadline.timeRemaining() > 0 && taskQueueRef.current.length > 0) {
        const task = taskQueueRef.current.shift();
        if (task) {
          try {
            task();
          } catch (error) {
            console.error('Background task error:', error);
          }
        }
      }

      if (taskQueueRef.current.length > 0) {
        requestIdleCallback(processNextTask);
      } else {
        isProcessingRef.current = false;
      }
    };

    requestIdleCallback(processNextTask);
  }, []);

  const addTask = useCallback((task: () => void) => {
    taskQueueRef.current.push(task);
    processQueue();
  }, [processQueue]);

  return { addTask };
};

// Web Workers フック
export const useWebWorker = <T, R>(
  workerScript: string,
  dependencies: any[] = []
) => {
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    const worker = new Worker(workerScript);
    workerRef.current = worker;

    worker.onmessage = (event) => {
      setResult(event.data);
      setLoading(false);
    };

    worker.onerror = (error) => {
      setError(new Error(error.message));
      setLoading(false);
    };

    return () => {
      worker.terminate();
    };
  }, [workerScript]);

  const execute = useCallback((data: T) => {
    if (workerRef.current) {
      setLoading(true);
      setError(null);
      workerRef.current.postMessage(data);
    }
  }, []);

  return { result, loading, error, execute };
};

// キャッシュフック
export const useCache = <T>(key: string, ttl: number = 5 * 60 * 1000) => {
  const cache = useMemo(() => new Map<string, { data: T; timestamp: number }>(), []);

  const get = useCallback((cacheKey: string): T | null => {
    const item = cache.get(cacheKey);
    if (!item) return null;

    if (Date.now() - item.timestamp > ttl) {
      cache.delete(cacheKey);
      return null;
    }

    return item.data;
  }, [cache, ttl]);

  const set = useCallback((cacheKey: string, data: T) => {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { get, set, clear };
};