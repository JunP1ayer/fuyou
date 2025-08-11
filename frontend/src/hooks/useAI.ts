// 🤖 AI機能フック

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';

interface AIState {
  isLearning: boolean;
  suggestions: any[];
  predictions: Record<string, any[]>;
  confidence: number;
  lastUpdate: Date | null;
}

interface PredictiveInputOptions {
  debounceMs?: number;
  minLength?: number;
  maxSuggestions?: number;
  context?: Record<string, any>;
}

export const useAI = () => {
  const [state, setState] = useState<AIState>({
    isLearning: false,
    suggestions: [],
    predictions: {},
    confidence: 0,
    lastUpdate: null,
  });

  const learningRef = useRef<boolean>(false);

  // 使用パターン学習
  const learnPatterns = useCallback(async () => {
    if (learningRef.current) return;

    learningRef.current = true;
    setState(prev => ({ ...prev, isLearning: true }));

    try {
      const patterns = await aiService.learnUsagePatterns();
      console.log('AI patterns learned:', patterns);
    } catch (error) {
      console.error('AI learning failed:', error);
    } finally {
      learningRef.current = false;
      setState(prev => ({ 
        ...prev, 
        isLearning: false,
        lastUpdate: new Date(),
      }));
    }
  }, []);

  // ユーザー行動を追跡
  const trackAction = useCallback((
    action: string, 
    context: Record<string, any> = {},
    duration?: number
  ) => {
    aiService.trackUserBehavior(action, context, duration);
  }, []);

  // スマート提案を取得
  const getSuggestions = useCallback(async () => {
    try {
      const suggestions = await aiService.generateSmartSuggestions();
      setState(prev => ({ 
        ...prev, 
        suggestions,
        confidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length || 0,
      }));
      return suggestions;
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      return [];
    }
  }, []);

  // 予測入力
  const getPredictions = useCallback(async (
    inputType: string,
    currentInput: string,
    context: Record<string, any> = {}
  ) => {
    try {
      const predictions = await aiService.predictInput(inputType, currentInput, context);
      setState(prev => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [inputType]: predictions,
        },
      }));
      return predictions;
    } catch (error) {
      console.error('Failed to get predictions:', error);
      return [];
    }
  }, []);

  // 異常検知
  const detectAnomalies = useCallback(async (data: any[]) => {
    try {
      return await aiService.detectAnomalies(data);
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return { anomalies: [], confidence: 0 };
    }
  }, []);

  // 自然言語処理
  const processNaturalLanguage = useCallback(async (text: string) => {
    try {
      return await aiService.processNaturalLanguage(text);
    } catch (error) {
      console.error('NLP processing failed:', error);
      return { intent: 'unknown', entities: {}, confidence: 0 };
    }
  }, []);

  // 初回学習
  useEffect(() => {
    const timer = setTimeout(() => {
      learnPatterns();
    }, 2000); // 2秒後に開始

    return () => clearTimeout(timer);
  }, [learnPatterns]);

  // 定期的な学習
  useEffect(() => {
    const interval = setInterval(() => {
      learnPatterns();
    }, 30 * 60 * 1000); // 30分ごと

    return () => clearInterval(interval);
  }, [learnPatterns]);

  return {
    state,
    trackAction,
    getSuggestions,
    getPredictions,
    detectAnomalies,
    processNaturalLanguage,
    learnPatterns,
  };
};

// 予測入力専用フック
export const usePredictiveInput = (
  inputType: string,
  options: PredictiveInputOptions = {}
) => {
  const { 
    debounceMs = 300,
    minLength = 2,
    maxSuggestions = 5,
    context = {},
  } = options;

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { getPredictions } = useAI();

  const predict = useCallback(async (input: string) => {
    if (input.length < minLength) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      const predictions = await getPredictions(inputType, input, context);
      setSuggestions(predictions.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Prediction failed:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [inputType, minLength, maxSuggestions, context, getPredictions]);

  const debouncedPredict = useCallback((input: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      predict(input);
    }, debounceMs);
  }, [predict, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    loading,
    predict: debouncedPredict,
    clearSuggestions: () => setSuggestions([]),
  };
};

// スマート通知フック
export const useSmartNotifications = () => {
  const { getSuggestions, trackAction } = useAI();
  const [notifications, setNotifications] = useState<any[]>([]);

  const checkForNotifications = useCallback(async () => {
    try {
      const suggestions = await getSuggestions();
      const highPriority = suggestions.filter(s => s.priority === 'high');
      setNotifications(highPriority);
      
      // 通知をトラッキング
      if (highPriority.length > 0) {
        trackAction('smart_notification_shown', {
          count: highPriority.length,
          types: highPriority.map(n => n.type),
        });
      }
    } catch (error) {
      console.error('Smart notification check failed:', error);
    }
  }, [getSuggestions, trackAction]);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    trackAction('smart_notification_dismissed', { id: notificationId });
  }, [trackAction]);

  const acceptSuggestion = useCallback((suggestion: any) => {
    trackAction('smart_suggestion_accepted', {
      type: suggestion.type,
      confidence: suggestion.confidence,
    });
  }, [trackAction]);

  // 定期チェック
  useEffect(() => {
    const interval = setInterval(checkForNotifications, 15 * 60 * 1000); // 15分ごと
    checkForNotifications(); // 初回実行

    return () => clearInterval(interval);
  }, [checkForNotifications]);

  return {
    notifications,
    dismissNotification,
    acceptSuggestion,
    checkForNotifications,
  };
};

// コンテキスト学習フック
export const useContextualLearning = () => {
  const { trackAction } = useAI();
  const contextRef = useRef<Record<string, any>>({});

  const updateContext = useCallback((updates: Record<string, any>) => {
    contextRef.current = { ...contextRef.current, ...updates };
  }, []);

  const trackWithContext = useCallback((action: string, additionalContext: Record<string, any> = {}) => {
    const fullContext = { ...contextRef.current, ...additionalContext };
    trackAction(action, fullContext);
  }, [trackAction]);

  return {
    updateContext,
    trackWithContext,
    getContext: () => contextRef.current,
  };
};

// パフォーマンス学習フック
export const usePerformanceLearning = () => {
  const { trackAction } = useAI();
  const performanceRef = useRef<{ startTime: number; metrics: Record<string, number> }>({
    startTime: Date.now(),
    metrics: {},
  });

  const startMeasurement = useCallback((metricName: string) => {
    performanceRef.current.metrics[metricName] = Date.now();
  }, []);

  const endMeasurement = useCallback((metricName: string, context: Record<string, any> = {}) => {
    const startTime = performanceRef.current.metrics[metricName];
    if (startTime) {
      const duration = Date.now() - startTime;
      trackAction('performance_measurement', {
        metric: metricName,
        duration,
        ...context,
      });
    }
  }, [trackAction]);

  const trackError = useCallback((error: Error, context: Record<string, any> = {}) => {
    trackAction('error_occurred', {
      error: error.message,
      stack: error.stack,
      ...context,
    });
  }, [trackAction]);

  const trackPageLoad = useCallback((pageName: string, loadTime: number) => {
    trackAction('page_load', {
      page: pageName,
      loadTime,
      timestamp: Date.now(),
    });
  }, [trackAction]);

  return {
    startMeasurement,
    endMeasurement,
    trackError,
    trackPageLoad,
  };
};