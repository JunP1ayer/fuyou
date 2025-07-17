import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { EnhancedCalculationService } from '../services/enhancedCalculationService';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/alerts - Get smart alerts based on current status
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = 'csv-user-temp'; // For demo purposes
      
      const enhancedService = new EnhancedCalculationService();
      
      // Get current calculation to generate contextual alerts
      const userProfile = {
        isStudent: true,
        age: 20,
        isMarried: false,
        hasSpouse: false
      };
      
      const calculation = await enhancedService.calculateEnhancedDeduction(userId, undefined, userProfile);
      
      // Generate alerts based on calculation results
      const alerts = [];
      const now = new Date().toISOString();
      
      // Add alerts from calculation engine
      if (calculation.alerts && calculation.alerts.length > 0) {
        calculation.alerts.forEach((alertMessage, index) => {
          alerts.push({
            id: `calc-${index + 1}`,
            alertType: calculation.riskLevel === 'danger' ? 'yearly_projection' : 
                     calculation.riskLevel === 'caution' ? 'limit_approach' : 'monthly_target',
            severity: calculation.riskLevel === 'danger' ? 'critical' : 
                     calculation.riskLevel === 'caution' ? 'warning' : 'info',
            title: calculation.riskLevel === 'danger' ? '年間予測で限度額超過' :
                   calculation.riskLevel === 'caution' ? '扶養限度額の警告' : '今月の目標収入',
            message: alertMessage,
            actionSuggestion: calculation.riskLevel === 'danger' ? '労働時間を減らすことを検討してください。' :
                            calculation.riskLevel === 'caution' ? '今後の労働計画を見直すことをお勧めします。' :
                            '計画的な労働時間の調整を行ってください。',
            isRead: false,
            isDismissed: false,
            triggeredAt: now
          });
        });
      }
      
      // Add working optimization alert if needed
      if (calculation.monthlyTarget < 100000) {
        const optimization = await enhancedService.generateWorkingOptimization(userId, 1000);
        alerts.push({
          id: 'optimization-1',
          alertType: 'schedule_optimization',
          severity: 'info',
          title: '労働時間最適化提案',
          message: `月間上限${Math.round(optimization.maxMonthlyHours)}時間で働けます`,
          actionSuggestion: optimization.recommendations.join('、'),
          isRead: false,
          isDismissed: false,
          triggeredAt: now
        });
      }
      
      // Add income detection alerts from recent CSV uploads
      const { data: recentUploads, error } = await supabase
        .from('csv_uploads')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('upload_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('upload_date', { ascending: false })
        .limit(3);
      
      if (!error && recentUploads && recentUploads.length > 0) {
        recentUploads.forEach((upload, index) => {
          if (upload.saved_incomes > 0) {
            alerts.push({
              id: `income-detected-${upload.id}`,
              alertType: 'new_income_detected',
              severity: 'info',
              title: '新しい収入を検出',
              message: `${upload.bank_type}のCSVから${upload.saved_incomes}件の収入を自動検出しました`,
              actionSuggestion: 'ダッシュボードで詳細を確認してください。',
              isRead: false,
              isDismissed: false,
              triggeredAt: upload.upload_date
            });
          }
        });
      }
      
      res.json({
        success: true,
        data: alerts
      });
      
    } catch (error) {
      logger.error('Alerts fetch error:', error);
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Failed to fetch alerts' }
      });
    }
  })
);

// POST /api/alerts/:id/read - Mark alert as read
router.post(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // For demo purposes, just return success
    // In a real implementation, this would update the alert status in the database
    res.json({
      success: true,
      message: `Alert ${id} marked as read`
    });
  })
);

// POST /api/alerts/:id/dismiss - Dismiss alert
router.post(
  '/:id/dismiss',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // For demo purposes, just return success
    // In a real implementation, this would update the alert status in the database
    res.json({
      success: true,
      message: `Alert ${id} dismissed`
    });
  })
);

export { router as alertRoutes };