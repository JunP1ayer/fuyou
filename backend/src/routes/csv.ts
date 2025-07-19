import express from 'express';
import multer from 'multer';
import { CSVParserService } from '../services/csvParserService';
import { logger } from '../utils/logger';
import { supabase } from '../utils/supabase';
import { requireAuthOrDemo } from '../middleware/validation';
import { randomUUID } from 'crypto';

const router = express.Router();
const csvParser = new CSVParserService();

// ファイルアップロード設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSVファイルのみアップロード可能です'));
    }
  },
});

// CSVファイルアップロード・処理エンドポイント
router.post('/upload', requireAuthOrDemo, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'CSVファイルが選択されていません'
      });
    }

    logger.info(`CSV upload started: ${req.file.originalname}, size: ${req.file.size}`);

    // CSVファイルをパース
    const parseResult = await csvParser.parseCSV(req.file.buffer);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'CSV処理エラー',
        details: parseResult.errors
      });
    }

    // 収入取引をデータベースに保存
    const savedIncomes = [];
    const userId = req.user!.id; // 認証されたユーザーID

    for (const income of parseResult.incomeTransactions) {
      try {
        // バイト先を自動検出
        const jobSource = csvParser.detectJobSource(income.description);

        // 重複チェック（日付、金額、説明の組み合わせ）
        const { data: existingIncome } = await supabase
          .from('incomes')
          .select('id')
          .eq('user_id', userId)
          .eq('income_date', income.date)
          .eq('amount', income.amount)
          .eq('description', income.description)
          .single();

        if (existingIncome) {
          logger.info(`重複スキップ: ${income.date} - ${income.amount}`);
          continue;
        }

        // 収入データを保存
        const { data: savedIncome, error } = await supabase
          .from('incomes')
          .insert({
            user_id: userId,
            amount: income.amount,
            source: jobSource,
            description: income.description,
            income_date: income.date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          logger.error('Income save error:', error);
          continue;
        }

        savedIncomes.push(savedIncome);

      } catch (error) {
        logger.error('Income processing error:', error);
      }
    }

    // CSVアップロード履歴を保存
    await supabase
      .from('csv_uploads')
      .insert({
        user_id: userId,
        filename: req.file.originalname,
        bank_type: parseResult.bankType,
        total_transactions: parseResult.totalTransactions,
        income_transactions: parseResult.incomeTransactions.length,
        saved_incomes: savedIncomes.length,
        upload_date: new Date().toISOString(),
        status: 'completed'
      });

    logger.info(`CSV処理完了: ${savedIncomes.length}件の収入を保存`);

    // レスポンス用に変換
    const responseIncomes = parseResult.incomeTransactions.map(income => ({
      date: income.date,
      amount: income.amount,
      description: income.description,
      source: csvParser.detectJobSource(income.description),
      confidence: income.confidence
    }));

    res.json({
      success: true,
      bankType: parseResult.bankType,
      totalTransactions: parseResult.totalTransactions,
      incomeTransactions: responseIncomes,
      savedCount: savedIncomes.length,
      errors: parseResult.errors
    });

  } catch (error) {
    logger.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CSV処理履歴取得
router.get('/history', requireAuthOrDemo, async (req, res) => {
  try {
    const userId = req.user!.id; // 認証されたユーザーID

    const { data: uploads, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      uploads: uploads || []
    });

  } catch (error) {
    logger.error('CSV history error:', error);
    res.status(500).json({
      success: false,
      error: '履歴取得エラー'
    });
  }
});

// CSV処理統計
router.get('/stats', requireAuthOrDemo, async (req, res) => {
  try {
    const userId = req.user!.id; // 認証されたユーザーID

    // 今月の処理統計
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { data: monthlyStats, error: monthlyError } = await supabase
      .from('csv_uploads')
      .select('total_transactions, income_transactions, saved_incomes')
      .eq('user_id', userId)
      .gte('upload_date', thisMonth.toISOString());

    if (monthlyError) {
      throw monthlyError;
    }

    // 全期間の統計
    const { data: totalStats, error: totalError } = await supabase
      .from('csv_uploads')
      .select('total_transactions, income_transactions, saved_incomes')
      .eq('user_id', userId);

    if (totalError) {
      throw totalError;
    }

    const monthlyTotals = (monthlyStats || []).reduce(
      (acc, upload) => ({
        totalTransactions: acc.totalTransactions + upload.total_transactions,
        incomeTransactions: acc.incomeTransactions + upload.income_transactions,
        savedIncomes: acc.savedIncomes + upload.saved_incomes,
      }),
      { totalTransactions: 0, incomeTransactions: 0, savedIncomes: 0 }
    );

    const allTimeTotals = (totalStats || []).reduce(
      (acc, upload) => ({
        totalTransactions: acc.totalTransactions + upload.total_transactions,
        incomeTransactions: acc.incomeTransactions + upload.income_transactions,
        savedIncomes: acc.savedIncomes + upload.saved_incomes,
      }),
      { totalTransactions: 0, incomeTransactions: 0, savedIncomes: 0 }
    );

    res.json({
      success: true,
      stats: {
        thisMonth: monthlyTotals,
        allTime: allTimeTotals,
        uploadCount: {
          thisMonth: (monthlyStats || []).length,
          allTime: (totalStats || []).length,
        }
      }
    });

  } catch (error) {
    logger.error('CSV stats error:', error);
    res.status(500).json({
      success: false,
      error: '統計取得エラー'
    });
  }
});

export { router as csvRoutes };