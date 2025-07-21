// Gemini-style Design Intelligence Service
// エージェント型デザイン自動最適化システム

interface UserContext {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  taskType: 'data-entry' | 'reading' | 'analysis' | 'casual';
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
  performanceProfile: {
    averageTaskTime: number;
    errorRate: number;
    satisfactionScore: number;
  };
}

interface DesignDecision {
  confidence: number;
  reasoning: string;
  expectedImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface EnhancedDesignTokens {
  baseTokens: Record<string, string>;
  contextualVariants: {
    [context: string]: Record<string, string>;
  };
  personalizations: {
    [userId: string]: Record<string, string>;
  };
  metadata: {
    lastUpdated: string;
    confidence: number;
    testResults: any[];
  };
}

export class DesignIntelligenceService {
  private userContexts: Map<string, UserContext> = new Map();
  private designPerformance: Map<string, number> = new Map();
  private activeTests: Map<string, any> = new Map();
  private behaviorData: Map<string, any[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private optimizationHistory: Map<string, any[]> = new Map();

  // Gemini-style コンテキスト解析
  async analyzeUserContext(userId: string, request: any): Promise<UserContext> {
    const userAgent = request.headers['user-agent'] || '';
    const currentHour = new Date().getHours();
    
    // デバイス検出
    const deviceType = this.detectDevice(userAgent);
    
    // 時間帯分析
    const timeOfDay = this.analyzeTimeOfDay(currentHour);
    
    // タスクタイプ推論（URL/行動パターンから）
    const taskType = this.inferTaskType(request.url, userId);
    
    // アクセシビリティニーズ検出
    const accessibility = await this.detectAccessibilityNeeds(userId);
    
    // パフォーマンスプロファイル取得
    const performanceProfile = await this.getUserPerformanceProfile(userId);
    
    const context: UserContext = {
      deviceType,
      timeOfDay,
      taskType,
      accessibility,
      performanceProfile,
    };
    
    this.userContexts.set(userId, context);
    return context;
  }

  // Gemini-style プロアクティブデザイン判断
  async makeDesignDecision(
    baseTokens: any,
    userContext: UserContext,
    userId: string
  ): Promise<DesignDecision> {
    
    // 1. 現在のデザインパフォーマンス分析
    const currentPerformance = this.designPerformance.get(userId) || 0.5;
    
    // 2. コンテキスト最適化計算
    let optimizationScore = 0;
    let reasoning = [];
    
    // 時間帯最適化
    if (userContext.timeOfDay === 'night') {
      optimizationScore += 0.3;
      reasoning.push('夜間モード: 低輝度・暖色系を適用');
    }
    
    // デバイス最適化  
    if (userContext.deviceType === 'mobile') {
      optimizationScore += 0.2;
      reasoning.push('モバイル: タッチターゲット・スペーシング拡大');
    }
    
    // タスク最適化
    if (userContext.taskType === 'data-entry') {
      optimizationScore += 0.25;
      reasoning.push('データ入力: 集中力向上色彩・コントラスト強化');
    }
    
    // アクセシビリティ最適化
    if (userContext.accessibility.highContrast) {
      optimizationScore += 0.4;
      reasoning.push('高コントラスト: WCAG AA準拠色彩適用');
    }
    
    // パフォーマンス最適化
    if (userContext.performanceProfile.errorRate > 0.1) {
      optimizationScore += 0.3;
      reasoning.push('エラー率高: UI明瞭性・ガイダンス強化');
    }
    
    // 3. リスク評価
    const riskLevel = this.assessRisk(optimizationScore, currentPerformance);
    
    // 4. 期待効果計算
    const expectedImpact = Math.min(optimizationScore * 0.8, 0.95);
    
    return {
      confidence: optimizationScore,
      reasoning: reasoning.join('; '),
      expectedImpact,
      riskLevel,
    };
  }

  // Gemini-style エージェント型適用判断
  async shouldApplyDesignChange(
    decision: DesignDecision,
    userId: string
  ): Promise<boolean> {
    
    // 高信頼度 & 低リスク → 即座適用
    if (decision.confidence > 0.8 && decision.riskLevel === 'low') {
      console.log(`🤖 自律適用: ${decision.reasoning}`);
      return true;
    }
    
    // 中信頼度 → A/Bテスト実行
    if (decision.confidence > 0.5 && decision.riskLevel === 'medium') {
      console.log(`🔬 A/Bテスト開始: ${decision.reasoning}`);
      await this.startABTest(userId, decision);
      return false; // A/B結果待ち
    }
    
    // 低信頼度 → 適用見送り
    console.log(`⏸️ 適用見送り: 信頼度不足 (${decision.confidence})`);
    return false;
  }

  // コンテキスト特化デザイントークン生成
  async generateContextualTokens(
    baseTokens: any,
    userContext: UserContext,
    userId: string
  ): Promise<Record<string, string>> {
    
    const contextualTokens = { ...baseTokens.colors };
    
    // 時間帯調整
    if (userContext.timeOfDay === 'night') {
      contextualTokens.primary = this.adjustForNightMode(contextualTokens.primary);
      contextualTokens['background-default'] = '#1a1a1a';
      contextualTokens['text-primary'] = '#e0e0e0';
    }
    
    // デバイス調整
    if (userContext.deviceType === 'mobile') {
      // タッチターゲット最適化は spacing で処理
    }
    
    // タスク調整
    if (userContext.taskType === 'data-entry') {
      contextualTokens.primary = '#2e7d32'; // 集中力向上緑
      contextualTokens['background-paper'] = '#f8f9fa'; // 目に優しい背景
    }
    
    // アクセシビリティ調整
    if (userContext.accessibility.highContrast) {
      contextualTokens.primary = '#000000';
      contextualTokens.secondary = '#ffffff';
      contextualTokens['text-primary'] = '#000000';
      contextualTokens.error = '#d32f2f';
    }
    
    // パーソナライゼーション適用
    const personalPrefs = await this.getPersonalPreferences(userId);
    if (personalPrefs) {
      Object.assign(contextualTokens, personalPrefs);
    }
    
    return contextualTokens;
  }

  // ユーティリティメソッド
  private detectDevice(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
    if (/Mobile|iPhone|iPod|Android.*Mobile/.test(userAgent)) return 'mobile';
    if (/iPad|Android(?!.*Mobile)/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private analyzeTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private inferTaskType(url: string, userId: string): 'data-entry' | 'reading' | 'analysis' | 'casual' {
    if (url.includes('/shifts') || url.includes('/csv')) return 'data-entry';
    if (url.includes('/dashboard')) return 'analysis';
    if (url.includes('/history')) return 'reading';
    return 'casual';
  }

  private async detectAccessibilityNeeds(userId: string) {
    // LocalStorage/Cookieからアクセシビリティ設定読込
    return {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
    };
  }

  private async getUserPerformanceProfile(userId: string) {
    // データベースから過去のパフォーマンス指標を取得
    return {
      averageTaskTime: 45000, // ms
      errorRate: 0.05,
      satisfactionScore: 0.8,
    };
  }

  private assessRisk(score: number, currentPerf: number): 'low' | 'medium' | 'high' {
    if (score > 0.8 && currentPerf > 0.7) return 'low';
    if (score > 0.5) return 'medium';
    return 'high';
  }

  private adjustForNightMode(color: string): string {
    // 色彩を夜間モード用に調整
    return color.replace(/#([0-9a-f]{6})/gi, (match, hex) => {
      const rgb = parseInt(hex, 16);
      const r = Math.max(0, ((rgb >> 16) & 255) * 0.7);
      const g = Math.max(0, ((rgb >> 8) & 255) * 0.7);  
      const b = Math.max(0, (rgb & 255) * 0.7);
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    });
  }

  private async startABTest(userId: string, decision: DesignDecision) {
    // A/Bテスト開始ロジック
    this.activeTests.set(userId, {
      decision,
      startTime: new Date(),
      variant: Math.random() > 0.5 ? 'A' : 'B',
    });
  }

  private async getPersonalPreferences(userId: string): Promise<Record<string, string> | null> {
    return this.userPreferences.get(userId) || null;
  }

  // ===========================================
  // 新規追加: Gemini式AI学習システム
  // ===========================================

  // ユーザー行動データ記録
  async recordUserBehavior(data: {
    userId: string;
    action: string;
    element: string;
    timestamp: number;
    metadata: any;
  }): Promise<void> {
    const userBehaviors = this.behaviorData.get(data.userId) || [];
    userBehaviors.push({
      ...data,
      recordedAt: new Date(),
    });
    
    // 最新100件のみ保持（メモリ効率化）
    if (userBehaviors.length > 100) {
      userBehaviors.splice(0, userBehaviors.length - 100);
    }
    
    this.behaviorData.set(data.userId, userBehaviors);
    
    // リアルタイム学習（簡易版）
    this.updateUserPerformanceScore(data.userId, data);
  }

  // パフォーマンス指標記録
  async recordPerformanceMetrics(userId: string, metrics: {
    taskCompletionTime: number;
    errorRate: number;
    satisfactionScore: number;
    accessibilityUsage: any;
  }): Promise<void> {
    // 現在のスコアと新しいスコアの加重平均
    const currentScore = this.designPerformance.get(userId) || 0.5;
    const newScore = Math.max(0, Math.min(1, 
      (1 - metrics.errorRate) * 0.4 + 
      metrics.satisfactionScore * 0.4 + 
      (metrics.taskCompletionTime < 60000 ? 0.2 : 0) // 1分以内完了ボーナス
    ));
    
    // 加重平均（新しい指標を30%、既存を70%）
    const updatedScore = currentScore * 0.7 + newScore * 0.3;
    this.designPerformance.set(userId, updatedScore);
    
    console.log(`📈 パフォーマンススコア更新: ${userId} = ${updatedScore.toFixed(3)} (前回: ${currentScore.toFixed(3)})`);
  }

  // A/Bテスト結果記録
  async recordABTestResult(result: {
    userId: string;
    testId: string;
    variant: 'A' | 'B';
    outcome: 'success' | 'failure' | 'neutral';
    timestamp: string;
  }): Promise<void> {
    const test = this.activeTests.get(result.userId);
    if (test && test.testId === result.testId) {
      test.result = result;
      test.completedAt = new Date();
      
      // A/Bテスト結果に基づいてAI判断精度を調整
      if (result.outcome === 'success') {
        const currentScore = this.designPerformance.get(result.userId) || 0.5;
        this.designPerformance.set(result.userId, Math.min(1, currentScore + 0.1));
        console.log(`✅ A/Bテスト成功: ${result.userId} スコア向上`);
      } else if (result.outcome === 'failure') {
        const currentScore = this.designPerformance.get(result.userId) || 0.5;
        this.designPerformance.set(result.userId, Math.max(0, currentScore - 0.05));
        console.log(`❌ A/Bテスト失敗: ${result.userId} スコア調整`);
      }
      
      // テスト完了
      this.activeTests.delete(result.userId);
    }
  }

  // ユーザー設定更新
  async updateUserPreferences(userId: string, preferences: {
    accessibility: any;
    colorScheme: string;
    density: string;
    animations: boolean;
  }): Promise<void> {
    this.userPreferences.set(userId, preferences);
    console.log(`⚙️ ユーザー設定更新: ${userId}`, preferences);
    
    // 設定変更を最適化履歴に記録
    const history = this.optimizationHistory.get(userId) || [];
    history.push({
      timestamp: new Date(),
      type: 'preference_update',
      data: preferences,
    });
    this.optimizationHistory.set(userId, history);
  }

  // 推奨事項生成
  async generateRecommendations(userId: string, context: UserContext): Promise<any[]> {
    const recommendations = [];
    
    // 時間帯ベース推奨
    if (context.timeOfDay === 'night') {
      recommendations.push({
        type: 'theme_adjustment',
        title: '夜間モード推奨',
        description: '目の疲労軽減のためダークテーマを適用しました',
        impact: 'medium',
        automatic: true,
      });
    }
    
    // パフォーマンスベース推奨
    const userScore = this.designPerformance.get(userId) || 0.5;
    if (userScore < 0.4) {
      recommendations.push({
        type: 'ui_simplification',
        title: 'UI簡素化推奨',
        description: '操作効率向上のためインターフェースを簡素化します',
        impact: 'high',
        automatic: false, // ユーザー確認必要
      });
    }
    
    // デバイスベース推奨
    if (context.deviceType === 'mobile') {
      recommendations.push({
        type: 'mobile_optimization',
        title: 'モバイル最適化',
        description: 'タッチ操作しやすいように要素サイズを調整しました',
        impact: 'medium',
        automatic: true,
      });
    }
    
    return recommendations;
  }

  // システム状態取得
  async getSystemStatus(): Promise<any> {
    return {
      learningActive: true,
      modelsLoaded: ['context_analyzer', 'decision_engine', 'personalization'],
      activeUsers: this.userContexts.size,
      abTestsRunning: this.activeTests.size,
      totalDecisions: Array.from(this.designPerformance.values()).length,
      accuracyScore: this.calculateSystemAccuracy(),
      lastModelUpdate: new Date().toISOString(),
    };
  }

  // 最適化履歴取得
  async getOptimizationHistory(userId: string, limit: number): Promise<any[]> {
    const history = this.optimizationHistory.get(userId) || [];
    return history.slice(-limit).reverse(); // 最新順
  }

  // プライベートメソッド
  private updateUserPerformanceScore(userId: string, behaviorData: any): void {
    const currentScore = this.designPerformance.get(userId) || 0.5;
    
    // 行動タイプに基づくスコア調整
    let adjustment = 0;
    switch (behaviorData.action) {
      case 'complete':
        adjustment = 0.05; // タスク完了は良い指標
        break;
      case 'error':
        adjustment = -0.03; // エラーは悪い指標
        break;
      case 'click':
        adjustment = 0.01; // 正常な操作
        break;
      default:
        adjustment = 0;
    }
    
    const newScore = Math.max(0, Math.min(1, currentScore + adjustment));
    this.designPerformance.set(userId, newScore);
  }

  private calculateSystemAccuracy(): number {
    const scores = Array.from(this.designPerformance.values());
    if (scores.length === 0) return 0.5;
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(averageScore * 1000) / 1000; // 小数点3桁
  }
}