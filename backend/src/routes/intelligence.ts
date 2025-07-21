// Gemini式Design Intelligence専用API
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { DesignIntelligenceService } from '../services/designIntelligenceService';

const router = Router();
const intelligenceService = new DesignIntelligenceService();

// ユーザー行動データ送信エンドポイント
router.post('/behavior', asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, element, timestamp, metadata } = req.body;
  
  console.log(`📊 行動データ受信: ${userId} - ${action} on ${element}`);
  
  // 行動データをAI学習システムに送信
  await intelligenceService.recordUserBehavior({
    userId,
    action, // 'click', 'scroll', 'focus', 'error', 'complete'
    element, // 'button-primary', 'form-input', 'card-content'
    timestamp,
    metadata // { taskTime, errorCount, etc. }
  });
  
  res.json({ success: true, message: '行動データを記録しました' });
}));

// パフォーマンス指標送信エンドポイント
router.post('/performance', asyncHandler(async (req: Request, res: Response) => {
  const { userId, metrics } = req.body;
  
  console.log(`⚡ パフォーマンス指標: ${userId}`, metrics);
  
  // パフォーマンス指標をAI分析システムに送信
  await intelligenceService.recordPerformanceMetrics(userId, {
    taskCompletionTime: metrics.taskTime,
    errorRate: metrics.errors / metrics.totalActions,
    satisfactionScore: metrics.satisfaction,
    accessibilityUsage: metrics.accessibility,
  });
  
  res.json({ success: true, message: 'パフォーマンス指標を記録しました' });
}));

// A/Bテスト結果報告エンドポイント
router.post('/ab-result', asyncHandler(async (req: Request, res: Response) => {
  const { userId, testId, variant, outcome } = req.body;
  
  console.log(`🔬 A/Bテスト結果: ${userId} - ${testId} (${variant}) = ${outcome}`);
  
  // A/Bテスト結果をAI学習に反映
  await intelligenceService.recordABTestResult({
    userId,
    testId,
    variant, // 'A' or 'B'
    outcome, // 'success', 'failure', 'neutral'
    timestamp: new Date().toISOString(),
  });
  
  res.json({ success: true, message: 'A/Bテスト結果を記録しました' });
}));

// ユーザー設定更新エンドポイント
router.post('/preferences', asyncHandler(async (req: Request, res: Response) => {
  const { userId, preferences } = req.body;
  
  console.log(`⚙️ ユーザー設定更新: ${userId}`, preferences);
  
  // ユーザー個人設定をAIパーソナライゼーションに反映
  await intelligenceService.updateUserPreferences(userId, {
    accessibility: preferences.accessibility,
    colorScheme: preferences.theme,
    density: preferences.density, // 'compact', 'standard', 'comfortable'
    animations: preferences.animations,
  });
  
  res.json({ success: true, message: 'ユーザー設定を更新しました' });
}));

// リアルタイムコンテキスト分析エンドポイント
router.get('/context/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // 現在のユーザーコンテキストを分析
  const context = await intelligenceService.analyzeUserContext(userId, req);
  
  // 最適化推奨を生成
  const recommendations = await intelligenceService.generateRecommendations(userId, context);
  
  res.json({
    success: true,
    data: {
      context,
      recommendations,
      timestamp: new Date().toISOString(),
    }
  });
}));

// AI学習状況確認エンドポイント
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const status = await intelligenceService.getSystemStatus();
  
  res.json({
    success: true,
    data: {
      learningActive: status.learningActive,
      modelsLoaded: status.modelsLoaded,
      activeUsers: status.activeUsers,
      abTestsRunning: status.abTestsRunning,
      totalDecisions: status.totalDecisions,
      accuracyScore: status.accuracyScore,
      lastModelUpdate: status.lastModelUpdate,
    }
  });
}));

// デザイン最適化履歴エンドポイント
router.get('/history/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const history = await intelligenceService.getOptimizationHistory(userId, limit);
  
  res.json({
    success: true,
    data: history.map(item => ({
      timestamp: item.timestamp,
      decision: item.decision,
      context: item.context,
      result: item.result,
      improvement: item.improvement,
    }))
  });
}));

export default router;