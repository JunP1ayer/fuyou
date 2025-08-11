// 🤖 AI/ML サービス

import { format, addDays, parseISO } from 'date-fns';

// ユーザー行動データの型
interface UserBehaviorData {
  timestamp: number;
  action: string;
  context: Record<string, any>;
  duration?: number;
}

// 予測結果の型
interface PredictionResult {
  confidence: number;
  value: any;
  reasoning?: string;
}

// 使用パターンの分析結果
interface UsagePattern {
  pattern: string;
  frequency: number;
  timePattern?: {
    preferredHours: number[];
    preferredDays: number[];
  };
  contextPattern?: Record<string, any>;
}

// スマート提案の型
interface SmartSuggestion {
  id: string;
  type: 'shift' | 'schedule' | 'optimization' | 'reminder';
  title: string;
  description: string;
  confidence: number;
  data: any;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

class AIService {
  private behaviorData: UserBehaviorData[] = [];
  private patterns: UsagePattern[] = [];
  private modelCache = new Map<string, any>();
  private isLearning = false;

  constructor() {
    this.loadStoredData();
    this.startPeriodicLearning();
  }

  // ユーザー行動を記録
  trackUserBehavior(action: string, context: Record<string, any> = {}, duration?: number) {
    const behaviorPoint: UserBehaviorData = {
      timestamp: Date.now(),
      action,
      context,
      duration,
    };

    this.behaviorData.push(behaviorPoint);
    
    // データが1000件を超えたら古いものを削除
    if (this.behaviorData.length > 1000) {
      this.behaviorData = this.behaviorData.slice(-1000);
    }

    this.saveStoredData();
  }

  // 使用パターンの学習
  async learnUsagePatterns(): Promise<UsagePattern[]> {
    if (this.isLearning) return this.patterns;
    
    this.isLearning = true;

    try {
      // アクション頻度の分析
      const actionFrequency = this.analyzeActionFrequency();
      
      // 時間パターンの分析
      const timePatterns = this.analyzeTimePatterns();
      
      // コンテキストパターンの分析
      const contextPatterns = this.analyzeContextPatterns();

      // パターンを統合
      this.patterns = this.combinePatterns(actionFrequency, timePatterns, contextPatterns);

      console.log('Learned usage patterns:', this.patterns);
      return this.patterns;
    } finally {
      this.isLearning = false;
    }
  }

  // 予測入力の提供
  async predictInput(
    inputType: string,
    currentInput: string,
    context: Record<string, any> = {}
  ): Promise<PredictionResult[]> {
    const cacheKey = `predict-${inputType}-${currentInput}-${JSON.stringify(context)}`;
    
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    let predictions: PredictionResult[] = [];

    switch (inputType) {
      case 'workplace':
        predictions = this.predictWorkplace(currentInput, context);
        break;
      case 'shiftTime':
        predictions = this.predictShiftTime(currentInput, context);
        break;
      case 'earnings':
        predictions = this.predictEarnings(currentInput, context);
        break;
      case 'schedule':
        predictions = this.predictSchedule(currentInput, context);
        break;
      default:
        predictions = this.predictGeneric(inputType, currentInput, context);
    }

    // キャッシュに保存（5分間有効）
    this.modelCache.set(cacheKey, predictions);
    setTimeout(() => this.modelCache.delete(cacheKey), 5 * 60 * 1000);

    return predictions;
  }

  // スマート提案の生成
  async generateSmartSuggestions(): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 使用パターンに基づく提案
    const patternSuggestions = await this.generatePatternBasedSuggestions();
    suggestions.push(...patternSuggestions);

    // 最適化提案
    const optimizationSuggestions = await this.generateOptimizationSuggestions();
    suggestions.push(...optimizationSuggestions);

    // リマインダー提案
    const reminderSuggestions = await this.generateReminderSuggestions();
    suggestions.push(...reminderSuggestions);

    // 信頼度でソート
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // 異常検知
  async detectAnomalies(data: any[]): Promise<{ anomalies: any[]; confidence: number }> {
    // 簡単な統計的異常検知
    if (data.length < 10) {
      return { anomalies: [], confidence: 0 };
    }

    const values = data.map(item => typeof item === 'number' ? item : item.value || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const threshold = 2 * stdDev; // 2シグマを異常値とする
    const anomalies = data.filter((item, index) => {
      const value = values[index];
      return Math.abs(value - mean) > threshold;
    });

    const confidence = anomalies.length > 0 ? Math.min(0.9, anomalies.length / data.length * 2) : 0;

    return { anomalies, confidence };
  }

  // 自然言語処理（簡易版）
  async processNaturalLanguage(text: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    const intents = [
      {
        pattern: /シフト.*追加|働く.*追加|バイト.*追加/i,
        intent: 'addShift',
        entities: this.extractShiftEntities(text),
      },
      {
        pattern: /給料.*計算|収入.*計算|扶養.*計算/i,
        intent: 'calculateEarnings',
        entities: this.extractCalculationEntities(text),
      },
      {
        pattern: /予定.*確認|スケジュール.*確認/i,
        intent: 'viewSchedule',
        entities: this.extractDateEntities(text),
      },
      {
        pattern: /設定.*変更|設定.*変更/i,
        intent: 'changeSettings',
        entities: this.extractSettingEntities(text),
      },
    ];

    for (const { pattern, intent, entities } of intents) {
      if (pattern.test(text)) {
        return {
          intent,
          entities,
          confidence: 0.8, // 簡易実装のため固定値
        };
      }
    }

    return {
      intent: 'unknown',
      entities: {},
      confidence: 0,
    };
  }

  // 予測モデルの訓練
  async trainPredictionModel(
    modelType: string,
    trainingData: any[]
  ): Promise<{ success: boolean; accuracy?: number }> {
    if (trainingData.length < 20) {
      return { success: false };
    }

    // 簡易的な線形回帰モデル
    const model = this.trainLinearRegression(trainingData);
    this.modelCache.set(`model-${modelType}`, model);

    // 交差検証でモデルの精度を評価
    const accuracy = this.evaluateModel(model, trainingData);

    return { success: true, accuracy };
  }

  // プライベートメソッド

  private loadStoredData() {
    try {
      const stored = localStorage.getItem('ai-behavior-data');
      if (stored) {
        this.behaviorData = JSON.parse(stored);
      }

      const storedPatterns = localStorage.getItem('ai-usage-patterns');
      if (storedPatterns) {
        this.patterns = JSON.parse(storedPatterns);
      }
    } catch (error) {
      console.error('Failed to load AI data:', error);
    }
  }

  private saveStoredData() {
    try {
      localStorage.setItem('ai-behavior-data', JSON.stringify(this.behaviorData));
      localStorage.setItem('ai-usage-patterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Failed to save AI data:', error);
    }
  }

  private startPeriodicLearning() {
    // 30分ごとにパターン学習を実行
    setInterval(() => {
      if (this.behaviorData.length > 50) {
        this.learnUsagePatterns();
      }
    }, 30 * 60 * 1000);
  }

  private analyzeActionFrequency(): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    this.behaviorData.forEach(item => {
      frequency[item.action] = (frequency[item.action] || 0) + 1;
    });

    return frequency;
  }

  private analyzeTimePatterns(): Record<string, { hours: number[]; days: number[] }> {
    const timePatterns: Record<string, { hours: number[]; days: number[] }> = {};

    this.behaviorData.forEach(item => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      if (!timePatterns[item.action]) {
        timePatterns[item.action] = { hours: [], days: [] };
      }

      timePatterns[item.action].hours.push(hour);
      timePatterns[item.action].days.push(day);
    });

    return timePatterns;
  }

  private analyzeContextPatterns(): Record<string, Record<string, any>> {
    const contextPatterns: Record<string, Record<string, any>> = {};

    this.behaviorData.forEach(item => {
      if (!contextPatterns[item.action]) {
        contextPatterns[item.action] = {};
      }

      Object.entries(item.context).forEach(([key, value]) => {
        if (!contextPatterns[item.action][key]) {
          contextPatterns[item.action][key] = {};
        }
        
        const valueKey = String(value);
        contextPatterns[item.action][key][valueKey] = 
          (contextPatterns[item.action][key][valueKey] || 0) + 1;
      });
    });

    return contextPatterns;
  }

  private combinePatterns(
    actionFreq: Record<string, number>,
    timePatterns: Record<string, { hours: number[]; days: number[] }>,
    contextPatterns: Record<string, Record<string, any>>
  ): UsagePattern[] {
    return Object.entries(actionFreq).map(([action, frequency]) => ({
      pattern: action,
      frequency,
      timePattern: timePatterns[action] ? {
        preferredHours: this.findPreferredValues(timePatterns[action].hours),
        preferredDays: this.findPreferredValues(timePatterns[action].days),
      } : undefined,
      contextPattern: contextPatterns[action],
    }));
  }

  private findPreferredValues(values: number[]): number[] {
    const frequency: Record<number, number> = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });

    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([val]) => parseInt(val));

    return sorted;
  }

  private predictWorkplace(input: string, context: any): PredictionResult[] {
    // 過去の職場データから予測
    const workplaceFreq = this.patterns
      .find(p => p.pattern === 'addShift')
      ?.contextPattern?.workplace || {};

    return Object.entries(workplaceFreq)
      .filter(([workplace]) => workplace.toLowerCase().includes(input.toLowerCase()))
      .map(([workplace, freq]) => ({
        confidence: Math.min(0.9, (freq as number) / 10),
        value: workplace,
        reasoning: `過去に${freq}回使用`,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private predictShiftTime(input: string, context: any): PredictionResult[] {
    // 時間パターンから予測
    const timePattern = this.patterns
      .find(p => p.pattern === 'addShift')
      ?.timePattern;

    if (!timePattern) return [];

    const preferredHours = timePattern.preferredHours || [];
    const suggestions = [];

    // よく使う時間帯を提案
    for (const hour of preferredHours) {
      suggestions.push({
        confidence: 0.7,
        value: `${hour}:00`,
        reasoning: `よく使用する時間帯`,
      });
    }

    return suggestions.slice(0, 3);
  }

  private predictEarnings(input: string, context: any): PredictionResult[] {
    // 過去の収入データから予測
    const earningsData = this.behaviorData
      .filter(item => item.action === 'addShift' && item.context.earnings)
      .map(item => item.context.earnings);

    if (earningsData.length < 3) return [];

    const avg = earningsData.reduce((sum, val) => sum + val, 0) / earningsData.length;
    
    return [{
      confidence: 0.6,
      value: Math.round(avg),
      reasoning: `過去の平均収入: ${Math.round(avg)}円`,
    }];
  }

  private predictSchedule(input: string, context: any): PredictionResult[] {
    // スケジュールパターンから予測
    const schedulePattern = this.patterns
      .find(p => p.pattern === 'viewSchedule')
      ?.timePattern;

    if (!schedulePattern) return [];

    return [{
      confidence: 0.5,
      value: 'weekly_view',
      reasoning: 'よく週間表示を使用',
    }];
  }

  private predictGeneric(type: string, input: string, context: any): PredictionResult[] {
    // 汎用的な予測
    return [];
  }

  private async generatePatternBasedSuggestions(): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // よく使用する機能の提案
    const topPatterns = this.patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    for (const pattern of topPatterns) {
      if (pattern.timePattern) {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (pattern.timePattern.preferredHours.includes(currentHour)) {
          suggestions.push({
            id: `pattern-${pattern.pattern}-${Date.now()}`,
            type: 'reminder',
            title: `${pattern.pattern}の時間です`,
            description: `いつもこの時間帯に${pattern.pattern}をしています`,
            confidence: 0.7,
            data: { action: pattern.pattern },
            priority: 'medium',
            expiresAt: addDays(new Date(), 1),
          });
        }
      }
    }

    return suggestions;
  }

  private async generateOptimizationSuggestions(): Promise<SmartSuggestion[]> {
    // 最適化提案の生成
    return [];
  }

  private async generateReminderSuggestions(): Promise<SmartSuggestion[]> {
    // リマインダー提案の生成
    return [];
  }

  private extractShiftEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // 時間の抽出
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/g);
    if (timeMatch) {
      entities.time = timeMatch[0];
    }

    // 日付の抽出
    const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日|(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      entities.date = dateMatch[0];
    }

    return entities;
  }

  private extractCalculationEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // 金額の抽出
    const amountMatch = text.match(/(\d+)円/);
    if (amountMatch) {
      entities.amount = parseInt(amountMatch[1]);
    }

    return entities;
  }

  private extractDateEntities(text: string): Record<string, any> {
    return this.extractShiftEntities(text);
  }

  private extractSettingEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // 設定項目の抽出
    if (text.includes('通知')) entities.setting = 'notification';
    if (text.includes('テーマ')) entities.setting = 'theme';
    if (text.includes('言語')) entities.setting = 'language';

    return entities;
  }

  private trainLinearRegression(data: any[]): any {
    // 簡易的な線形回帰の実装
    if (data.length < 2) return null;

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, i) => {
      const x = i;
      const y = typeof point === 'number' ? point : point.value || 0;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private evaluateModel(model: any, data: any[]): number {
    if (!model) return 0;

    let totalError = 0;
    data.forEach((point, i) => {
      const predicted = model.slope * i + model.intercept;
      const actual = typeof point === 'number' ? point : point.value || 0;
      totalError += Math.abs(predicted - actual);
    });

    const meanError = totalError / data.length;
    const dataRange = Math.max(...data.map(p => typeof p === 'number' ? p : p.value || 0)) - 
                     Math.min(...data.map(p => typeof p === 'number' ? p : p.value || 0));
    
    return Math.max(0, 1 - (meanError / dataRange));
  }
}

export const aiService = new AIService();