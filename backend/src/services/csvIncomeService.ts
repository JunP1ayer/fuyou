import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import { ParsedTransaction } from './csvParserService';

export interface CSVIncomeProcessingResult {
  uploadId: string;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  createdIncomes: string[];
  warnings: string[];
}

export class CSVIncomeService {
  
  /**
   * CSVの取引データを収入データとしてデータベースに保存
   */
  async processCSVTransactions(
    userId: string,
    transactions: ParsedTransaction[],
    bankType: string,
    uploadMetadata: {
      filename: string;
      fileSize: number;
    }
  ): Promise<CSVIncomeProcessingResult> {
    
    const startTime = Date.now();
    
    // CSVアップロード記録を作成
    const { data: csvUpload, error: uploadError } = await supabase
      .from('csv_uploads')
      .insert({
        user_id: userId,
        filename: uploadMetadata.filename,
        bank_type: bankType,
        file_size: uploadMetadata.fileSize,
        total_rows: transactions.length,
        status: 'processing'
      })
      .select()
      .single();

    if (uploadError || !csvUpload) {
      logger.error('Failed to create CSV upload record:', uploadError);
      throw new Error('CSV処理の初期化に失敗しました');
    }

    const result: CSVIncomeProcessingResult = {
      uploadId: csvUpload.id,
      processedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      createdIncomes: [],
      warnings: []
    };

    try {
      // 重複チェック用のインデックス作成
      const existingTransactions = await this.getExistingTransactionHashes(userId);

      for (const transaction of transactions) {
        try {
          const processed = await this.processTransaction(
            userId,
            transaction,
            csvUpload.id,
            existingTransactions
          );

          if (processed.created) {
            result.createdIncomes.push(processed.incomeId!);
            result.processedCount++;
          } else if (processed.skipped) {
            result.skippedCount++;
            if (processed.reason) {
              result.warnings.push(processed.reason);
            }
          }
        } catch (error) {
          result.errorCount++;
          logger.warn('Failed to process transaction:', { transaction, error });
          
          // エラー詳細を記録
          await this.recordProcessingError(
            csvUpload.id,
            transactions.indexOf(transaction) + 1,
            'processing_error',
            error instanceof Error ? error.message : 'Unknown error',
            transaction
          );
        }
      }

      // 処理完了の記録
      const processingTime = Date.now() - startTime;
      const averageConfidence = transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length 
        : 0;

      await supabase
        .from('csv_uploads')
        .update({
          processed_rows: result.processedCount,
          income_rows: result.processedCount,
          status: 'completed',
          processing_time_ms: processingTime,
          average_confidence: averageConfidence,
          completed_at: new Date().toISOString()
        })
        .eq('id', csvUpload.id);

      logger.info('CSV processing completed:', {
        uploadId: csvUpload.id,
        processedCount: result.processedCount,
        skippedCount: result.skippedCount,
        errorCount: result.errorCount,
        processingTimeMs: processingTime
      });

      return result;

    } catch (error) {
      // 処理失敗の記録
      await supabase
        .from('csv_uploads')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', csvUpload.id);

      logger.error('CSV processing failed:', { uploadId: csvUpload.id, error });
      throw error;
    }
  }

  /**
   * 個別の取引データを処理
   */
  private async processTransaction(
    userId: string,
    transaction: ParsedTransaction,
    uploadId: string,
    existingHashes: Set<string>
  ): Promise<{
    created: boolean;
    skipped: boolean;
    incomeId?: string;
    reason?: string;
  }> {
    
    // 重複チェック用のハッシュ生成
    const transactionHash = this.generateTransactionHash(transaction);
    
    if (existingHashes.has(transactionHash)) {
      return {
        created: false,
        skipped: true,
        reason: `重複取引: ${transaction.date} - ${transaction.amount}円`
      };
    }

    // 最小金額チェック
    if (transaction.amount < 100) {
      return {
        created: false,
        skipped: true,
        reason: `金額が小さすぎます: ${transaction.amount}円`
      };
    }

    // カテゴリーと信頼度による判定
    if (transaction.confidence < 0.3) {
      return {
        created: false,
        skipped: true,
        reason: `信頼度が低すぎます: ${(transaction.confidence * 100).toFixed(1)}%`
      };
    }

    try {
      // バイト先の自動検出・作成
      const jobSourceId = await this.findOrCreateJobSource(
        userId,
        transaction.description,
        'part_time_job'
      );

      // 収入データを挿入
      const { data: income, error } = await supabase
        .from('incomes')
        .insert({
          user_id: userId,
          amount: transaction.amount,
          income_date: transaction.date,
          description: transaction.description,
          source: 'part_time_job',
          transaction_id: transactionHash // transaction_idフィールドを重複チェック用に使用
        })
        .select()
        .single();

      if (error) {
        throw new Error(`収入データの保存に失敗: ${error.message}`);
      }

      // ハッシュを追加（次回以降の重複チェック用）
      existingHashes.add(transactionHash);

      return {
        created: true,
        skipped: false,
        incomeId: income.id
      };

    } catch (error) {
      logger.error('Transaction processing error:', { transaction, error });
      throw error;
    }
  }

  /**
   * バイト先の自動検出・作成
   */
  private async findOrCreateJobSource(
    userId: string,
    description: string,
    category: string
  ): Promise<string | null> {
    
    // 既存のバイト先から類似するものを検索
    const { data: existingJobSources } = await supabase
      .from('job_sources')
      .select('id, name, category')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (existingJobSources) {
      for (const jobSource of existingJobSources) {
        if (this.isDescriptionMatchingJobSource(description, jobSource.name)) {
          return jobSource.id;
        }
      }
    }

    // 新しいバイト先を自動作成（一定の条件を満たす場合のみ）
    const extractedName = this.extractJobSourceName(description);
    
    if (extractedName && extractedName.length >= 3) {
      try {
        const { data: newJobSource, error } = await supabase
          .from('job_sources')
          .insert({
            user_id: userId,
            name: extractedName,
            category: category,
            is_active: true
          })
          .select()
          .single();

        if (!error && newJobSource) {
          logger.info('Auto-created job source:', {
            jobSourceId: newJobSource.id,
            name: extractedName,
            category
          });
          return newJobSource.id;
        }
      } catch (error) {
        logger.warn('Failed to auto-create job source:', { extractedName, error });
      }
    }

    return null; // バイト先を特定できない場合
  }

  /**
   * 説明文からバイト先名を抽出
   */
  private extractJobSourceName(description: string): string | null {
    // 企業名っぽいパターンを抽出
    const patterns = [
      /([ァ-ヴー]+)\s*(?:株式会社|有限会社|\(株\)|\(有\))/,
      /([A-Za-z][A-Za-z0-9\s]*)\s*(?:株式会社|有限会社|\(株\)|\(有\))/,
      /([ァ-ヴー]{3,})\s*(?:店|支店)/,
      /([A-Za-z]{3,})\s*(?:店|支店)/
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // 単純なカタカナ企業名
    const katakanaMatch = description.match(/([ァ-ヴー]{4,})/);
    if (katakanaMatch) {
      return katakanaMatch[1];
    }

    return null;
  }

  /**
   * 説明文とバイト先名のマッチング判定
   */
  private isDescriptionMatchingJobSource(description: string, jobSourceName: string): boolean {
    const normalizedDescription = description.toLowerCase();
    const normalizedJobSourceName = jobSourceName.toLowerCase();
    
    // 完全一致または部分一致
    return normalizedDescription.includes(normalizedJobSourceName) ||
           normalizedJobSourceName.includes(normalizedDescription);
  }

  /**
   * 取引データのハッシュ生成（重複チェック用）
   */
  private generateTransactionHash(transaction: ParsedTransaction): string {
    const hashInput = `${transaction.date}-${transaction.amount}-${transaction.description.slice(0, 50)}`;
    return Buffer.from(hashInput).toString('base64').slice(0, 32);
  }

  /**
   * 既存の取引ハッシュを取得
   */
  private async getExistingTransactionHashes(userId: string): Promise<Set<string>> {
    const { data: existingIncomes } = await supabase
      .from('incomes')
      .select('transaction_id')
      .eq('user_id', userId)
      .not('transaction_id', 'is', null);

    const hashes = new Set<string>();
    if (existingIncomes) {
      existingIncomes.forEach(income => {
        if (income.transaction_id) {
          hashes.add(income.transaction_id);
        }
      });
    }

    return hashes;
  }

  /**
   * 処理エラーの記録
   */
  private async recordProcessingError(
    uploadId: string,
    rowNumber: number,
    errorType: string,
    errorMessage: string,
    rawData: any
  ): Promise<void> {
    try {
      await supabase
        .from('csv_processing_errors')
        .insert({
          csv_upload_id: uploadId,
          row_number: rowNumber,
          error_type: errorType,
          error_message: errorMessage,
          raw_row_data: rawData
        });
    } catch (error) {
      logger.warn('Failed to record processing error:', error);
    }
  }

  /**
   * CSV処理履歴の取得
   */
  async getCSVProcessingHistory(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    filename: string;
    bankType: string;
    processedAt: string;
    status: string;
    totalRows: number;
    incomeRows: number;
    processingTimeMs: number;
  }>> {
    const { data: uploads } = await supabase
      .from('csv_uploads')
      .select(`
        id,
        filename,
        bank_type,
        created_at,
        status,
        total_rows,
        income_rows,
        processing_time_ms
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!uploads) return [];

    return uploads.map(upload => ({
      id: upload.id,
      filename: upload.filename,
      bankType: upload.bank_type,
      processedAt: upload.created_at,
      status: upload.status,
      totalRows: upload.total_rows || 0,
      incomeRows: upload.income_rows || 0,
      processingTimeMs: upload.processing_time_ms || 0
    }));
  }

  /**
   * CSV処理統計の取得
   */
  async getCSVProcessingStats(userId: string): Promise<{
    totalUploads: number;
    successfulUploads: number;
    totalIncomeRecords: number;
    averageProcessingTime: number;
    lastUploadDate: string | null;
  }> {
    const { data: stats } = await supabase
      .rpc('get_csv_processing_stats', {
        p_user_id: userId
      });

    if (!stats || stats.length === 0) {
      return {
        totalUploads: 0,
        successfulUploads: 0,
        totalIncomeRecords: 0,
        averageProcessingTime: 0,
        lastUploadDate: null
      };
    }

    const result = stats[0];
    
    // 最新のアップロード日時を取得
    const { data: lastUpload } = await supabase
      .from('csv_uploads')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalUploads: result.total_uploads || 0,
      successfulUploads: result.successful_uploads || 0,
      totalIncomeRecords: result.total_income_records || 0,
      averageProcessingTime: result.average_processing_time_ms || 0,
      lastUploadDate: lastUpload?.created_at || null
    };
  }
}

export const csvIncomeService = new CSVIncomeService();