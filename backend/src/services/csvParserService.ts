import csv from 'csv-parser';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'unknown';
  confidence: number;
  rawData: Record<string, any>;
}

export interface CSVParseResult {
  success: boolean;
  bankType: string;
  transactions: ParsedTransaction[];
  incomeTransactions: ParsedTransaction[];
  totalTransactions: number;
  errors: string[];
}

interface BankFormat {
  name: string;
  detectPattern: (headers: string[]) => boolean;
  columnMap: {
    date: string;
    amount: string;
    description: string;
    balance?: string;
  };
  dateFormat: string;
  amountParser: (value: string) => number;
}

// 主要銀行のCSVフォーマット定義
const BANK_FORMATS: BankFormat[] = [
  {
    name: '三菱UFJ銀行',
    detectPattern: (headers) => 
      headers.some(h => h.includes('取引日')) && 
      headers.some(h => h.includes('摘要')),
    columnMap: {
      date: '取引日',
      amount: '取引金額',
      description: '摘要',
      balance: '残高'
    },
    dateFormat: 'YYYY/MM/DD',
    amountParser: (value: string) => {
      // カンマを除去してパース
      const cleaned = value.replace(/[,円]/g, '');
      return parseInt(cleaned) || 0;
    }
  },
  {
    name: '三井住友銀行',
    detectPattern: (headers) => 
      headers.some(h => h.includes('日付')) && 
      headers.some(h => h.includes('金額')),
    columnMap: {
      date: '日付',
      amount: '金額',
      description: '内容',
      balance: '残高'
    },
    dateFormat: 'YYYY/MM/DD',
    amountParser: (value: string) => {
      const cleaned = value.replace(/[,円]/g, '');
      return parseInt(cleaned) || 0;
    }
  },
  {
    name: 'みずほ銀行',
    detectPattern: (headers) => 
      headers.some(h => h.includes('年月日')) && 
      headers.some(h => h.includes('出金金額') || h.includes('入金金額')),
    columnMap: {
      date: '年月日',
      amount: '入金金額', // または出金金額
      description: '摘要',
    },
    dateFormat: 'YYYY/MM/DD',
    amountParser: (value: string) => {
      const cleaned = value.replace(/[,円]/g, '');
      return parseInt(cleaned) || 0;
    }
  },
  {
    name: 'ゆうちょ銀行',
    detectPattern: (headers) => 
      headers.some(h => h.includes('取扱日')) && 
      headers.some(h => h.includes('お取扱内容')),
    columnMap: {
      date: '取扱日',
      amount: '取扱金額',
      description: 'お取扱内容',
    },
    dateFormat: 'YYYY/MM/DD',
    amountParser: (value: string) => {
      const cleaned = value.replace(/[,円]/g, '');
      return parseInt(cleaned) || 0;
    }
  }
];

// 収入を示すキーワード
const INCOME_KEYWORDS = [
  '給与', '給料', 'キュウリョウ', 'SALARY',
  'アルバイト', 'バイト', 'PART', 'ARBEIT',
  '振込', 'フリコミ', 'TRANSFER', 'PAYMENT',
  '入金', 'ニュウキン', 'DEPOSIT',
  '報酬', 'ホウシュウ', 'FEE', 'REWARD',
  '賞与', 'ボーナス', 'BONUS',
  '時給', '日給', '月給', '年収',
  'PAY', 'WAGE', 'INCOME'
];

export class CSVParserService {
  
  async parseCSV(fileBuffer: Buffer): Promise<CSVParseResult> {
    try {
      const fileContent = fileBuffer.toString('utf-8');
      
      // CSVをパース
      const rawData = await this.parseCSVContent(fileContent);
      
      if (rawData.length === 0) {
        throw new Error('CSVファイルにデータが含まれていません');
      }
      
      // 銀行フォーマットを自動検出
      const headers = Object.keys(rawData[0]);
      const bankFormat = this.detectBankFormat(headers);
      
      if (!bankFormat) {
        throw new Error('対応していない銀行のCSVフォーマットです');
      }
      
      logger.info(`銀行フォーマット検出: ${bankFormat.name}`);
      
      // 取引データを変換
      const transactions = this.convertToTransactions(rawData, bankFormat);
      
      // 収入取引を識別
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      
      return {
        success: true,
        bankType: bankFormat.name,
        transactions,
        incomeTransactions,
        totalTransactions: transactions.length,
        errors: []
      };
      
    } catch (error) {
      logger.error('CSV parsing error:', error);
      return {
        success: false,
        bankType: 'Unknown',
        transactions: [],
        incomeTransactions: [],
        totalTransactions: 0,
        errors: [error instanceof Error ? error.message : 'CSVパースエラー']
      };
    }
  }
  
  private async parseCSVContent(content: string): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, any>[] = [];
      
      Readable.from(content)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }
  
  private detectBankFormat(headers: string[]): BankFormat | null {
    for (const format of BANK_FORMATS) {
      if (format.detectPattern(headers)) {
        return format;
      }
    }
    return null;
  }
  
  private convertToTransactions(
    rawData: Record<string, any>[], 
    bankFormat: BankFormat
  ): ParsedTransaction[] {
    return rawData.map(row => {
      try {
        const date = this.parseDate(row[bankFormat.columnMap.date]);
        const description = row[bankFormat.columnMap.description] || '';
        
        // みずほ銀行の場合、入金・出金を分けて処理
        let amount = 0;
        if (bankFormat.name === 'みずほ銀行') {
          const incomeAmount = row['入金金額'] || '0';
          const expenseAmount = row['出金金額'] || '0';
          
          const incomeValue = bankFormat.amountParser(incomeAmount);
          const expenseValue = bankFormat.amountParser(expenseAmount);
          
          amount = incomeValue > 0 ? incomeValue : -expenseValue;
        } else {
          amount = bankFormat.amountParser(row[bankFormat.columnMap.amount] || '0');
        }
        
        // 収入判定
        const { type, confidence } = this.classifyTransaction(description, amount);
        
        return {
          date,
          amount: Math.abs(amount), // 金額は絶対値で保存
          description,
          type,
          confidence,
          rawData: row
        };
        
      } catch (error) {
        logger.warn('Transaction conversion error:', error);
        return {
          date: '',
          amount: 0,
          description: '',
          type: 'unknown' as const,
          confidence: 0,
          rawData: row
        };
      }
    }).filter(t => t.date && t.amount > 0); // 有効なデータのみ
  }
  
  private parseDate(dateString: string): string {
    if (!dateString) return '';
    
    // 日本の日付形式を統一（YYYY-MM-DD）
    const cleaned = dateString.replace(/[年月日]/g, match => {
      switch (match) {
        case '年': return '-';
        case '月': return '-';
        case '日': return '';
        default: return match;
      }
    });
    
    // スラッシュをハイフンに変換
    const normalized = cleaned.replace(/\//g, '-');
    
    // YYYY-MM-DD形式に統一
    try {
      const date = new Date(normalized);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  
  private classifyTransaction(description: string, amount: number): {
    type: 'income' | 'expense' | 'unknown';
    confidence: number;
  } {
    // 収入の可能性をチェック
    const lowerDescription = description.toLowerCase();
    
    let incomeScore = 0;
    const totalKeywords = INCOME_KEYWORDS.length;
    
    for (const keyword of INCOME_KEYWORDS) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        incomeScore += 1;
      }
    }
    
    // 金額が正の場合（入金）は収入の可能性が高い
    const amountBonus = amount > 0 ? 0.3 : -0.3;
    
    // 信頼度計算（0-1）
    const confidence = Math.max(0, Math.min(1, (incomeScore / totalKeywords) + amountBonus));
    
    // 閾値による分類
    if (confidence > 0.3) {
      return { type: 'income', confidence };
    } else if (amount < 0) {
      return { type: 'expense', confidence: 1 - confidence };
    } else {
      return { type: 'unknown', confidence: 0.5 };
    }
  }
  
  // バイト先の自動検出
  detectJobSource(description: string): string {
    const commonSources = [
      { pattern: /コンビニ|セブン|ローソン|ファミマ/i, name: 'コンビニ' },
      { pattern: /マック|マクドナルド|KFC|モス/i, name: 'ファストフード' },
      { pattern: /スタバ|カフェ|喫茶/i, name: 'カフェ' },
      { pattern: /塾|予備校|個別指導/i, name: '塾講師' },
      { pattern: /配達|ウーバー|出前/i, name: 'デリバリー' },
      { pattern: /アパレル|洋服|服飾/i, name: 'アパレル' },
      { pattern: /スーパー|イオン|業務スーパー/i, name: 'スーパー' },
    ];
    
    for (const source of commonSources) {
      if (source.pattern.test(description)) {
        return source.name;
      }
    }
    
    // 株式会社などの企業名から推測
    const companyMatch = description.match(/(株式会社|有限会社|合同会社)(.+)/);
    if (companyMatch) {
      return companyMatch[2].substring(0, 10); // 最初の10文字
    }
    
    return 'その他';
  }
}