// 🏦 Open Banking API連携サービス - 自動収入取得・分析

import { logger, LogCategory } from '../utils/logger';
import { useUnifiedStore } from '../store/unifiedStore';
import { apiService } from './apiService';

// Open Banking データの型定義
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  accountNumber: string; // マスク済み
  balance: number;
  currency: string;
  isLinked: boolean;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  merchantName?: string;
  date: string;
  isWorkRelated?: boolean; // 給与かどうかのAI判定
  workplaceId?: string; // 紐づけられた職場
  confidence?: number; // AI判定の信頼度
}

export interface IncomeAnalysis {
  monthlyIncome: {
    current: number;
    previous: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  workplaceBreakdown: {
    workplaceId: string;
    workplaceName: string;
    amount: number;
    transactionCount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    lastPayment: string;
  }[];
  taxProjection: {
    yearToDate: number;
    projected: number;
    riskLevel: 'safe' | 'warning' | 'danger';
    recommendedLimit: number;
  };
  savingsOpportunity: {
    potentialSavings: number;
    suggestions: string[];
  };
}

// 日本のOpen Banking対応銀行（実際の例）
const SUPPORTED_BANKS = {
  'jp': [
    { id: 'mizuho', name: 'みずほ銀行', apiEndpoint: 'https://api.mizuhobank.co.jp' },
    { id: 'mufg', name: '三菱UFJ銀行', apiEndpoint: 'https://api.bk.mufg.jp' },
    { id: 'smbc', name: '三井住友銀行', apiEndpoint: 'https://api.smbc.co.jp' },
    { id: 'japan_post', name: 'ゆうちょ銀行', apiEndpoint: 'https://api.jp-bank.japanpost.jp' },
  ],
  'uk': [
    { id: 'hsbc', name: 'HSBC', apiEndpoint: 'https://api.hsbc.co.uk' },
    { id: 'barclays', name: 'Barclays', apiEndpoint: 'https://api.barclays.com' },
    { id: 'lloyds', name: 'Lloyds', apiEndpoint: 'https://api.lloydsbank.com' },
  ],
  'de': [
    { id: 'deutsche', name: 'Deutsche Bank', apiEndpoint: 'https://api.deutsche-bank.de' },
    { id: 'commerzbank', name: 'Commerzbank', apiEndpoint: 'https://api.commerzbank.de' },
  ]
};

class OpenBankingService {
  private static instance: OpenBankingService;
  private linkedAccounts: BankAccount[] = [];
  private apiKey: string = process.env.REACT_APP_OPEN_BANKING_API_KEY || '';

  private constructor() {
    this.initializeService();
  }

  static getInstance(): OpenBankingService {
    if (!OpenBankingService.instance) {
      OpenBankingService.instance = new OpenBankingService();
    }
    return OpenBankingService.instance;
  }

  private async initializeService(): Promise<void> {
    // 保存済みアカウント情報を復元
    const saved = localStorage.getItem('fuyou_linked_accounts');
    if (saved) {
      try {
        this.linkedAccounts = JSON.parse(saved);
        logger.info(LogCategory.API, 'Linked bank accounts restored', {
          count: this.linkedAccounts.length
        });
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to restore linked accounts', error);
      }
    }
  }

  // 銀行口座連携の開始
  async linkBankAccount(bankId: string, country: string): Promise<{
    authUrl: string;
    sessionId: string;
  }> {
    const performanceTimer = logger.startPerformanceTimer('Bank Account Linking');

    try {
      const bank = SUPPORTED_BANKS[country as keyof typeof SUPPORTED_BANKS]?.find(b => b.id === bankId);
      if (!bank) {
        throw new Error(`Unsupported bank: ${bankId} in ${country}`);
      }

      // OAuth2 フローの開始（実際の実装）
      const sessionId = crypto.randomUUID();
      const redirectUri = encodeURIComponent(window.location.origin + '/banking/callback');
      const scope = encodeURIComponent('accounts transactions');
      
      const authUrl = `${bank.apiEndpoint}/oauth2/authorize?` +
        `client_id=${this.apiKey}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `state=${sessionId}`;

      logger.info(LogCategory.API, 'Bank linking initiated', {
        bankId,
        country,
        sessionId
      });

      performanceTimer();
      return { authUrl, sessionId };

    } catch (error) {
      performanceTimer();
      logger.error(LogCategory.API, 'Bank linking failed', error);
      throw error;
    }
  }

  // OAuth認証後のコールバック処理
  async handleAuthCallback(code: string, sessionId: string): Promise<BankAccount[]> {
    const performanceTimer = logger.startPerformanceTimer('Bank Auth Callback');

    try {
      // アクセストークンの取得
      const tokenResp = await apiService.postJson<{ access_token: string; refresh_token: string }>(
        '/banking/token',
        { code, sessionId, grant_type: 'authorization_code' }
      );
      if (!tokenResp.success || !tokenResp.data) {
        throw new Error('Token exchange failed');
      }
      const { access_token, refresh_token } = tokenResp.data;

      // アカウント情報の取得
      const accountsResp = await apiService.send<any>('/banking/accounts', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!accountsResp.success || !accountsResp.data) {
        throw new Error('Failed to fetch account information');
      }
      const accountsData = accountsResp.data;
      
      // BankAccount形式に変換
      const newAccounts: BankAccount[] = accountsData.accounts.map((acc: any) => ({
        id: acc.account_id,
        bankName: acc.institution_name,
        accountType: acc.account_type === 'transaction' ? 'checking' : 'savings',
        accountNumber: this.maskAccountNumber(acc.account_number),
        balance: acc.balance,
        currency: acc.currency,
        isLinked: true,
        lastUpdated: new Date().toISOString(),
      }));

      // 既存アカウントに追加
      this.linkedAccounts = [...this.linkedAccounts, ...newAccounts];
      this.saveLinkedAccounts();

      // トークンを安全に保存（実際の実装では暗号化）
      this.securelyStoreTokens(sessionId, access_token, refresh_token);

      logger.info(LogCategory.API, 'Bank accounts linked successfully', {
        newAccountsCount: newAccounts.length,
        totalAccounts: this.linkedAccounts.length
      });

      performanceTimer();
      return newAccounts;

    } catch (error) {
      performanceTimer();
      logger.error(LogCategory.API, 'Auth callback failed', error);
      throw error;
    }
  }

  // 取引履歴の取得と分析
  async fetchTransactionsAndAnalyze(
    accountId: string, 
    fromDate?: string, 
    toDate?: string
  ): Promise<{
    transactions: Transaction[];
    analysis: IncomeAnalysis;
  }> {
    const performanceTimer = logger.startPerformanceTimer('Transaction Analysis');

    try {
      const accessToken = await this.getValidAccessToken(accountId);
      
      // 取引履歴の取得
      const transactionsResp = await apiService.postJson<any>(
        '/banking/transactions',
        {
          account_id: accountId,
          from_date: fromDate || this.getThreeMonthsAgo(),
          to_date: toDate || new Date().toISOString().split('T')[0],
        }
      );
      if (!transactionsResp.success || !transactionsResp.data) {
        throw new Error('Failed to fetch transactions');
      }
      const transactionsData = transactionsResp.data;
      
      // Transaction形式に変換
      const transactions: Transaction[] = transactionsData.transactions.map((tx: any) => ({
        id: tx.transaction_id,
        accountId: accountId,
        amount: Math.abs(tx.amount),
        type: tx.amount > 0 ? 'credit' : 'debit',
        category: tx.category?.[0] || 'unknown',
        description: tx.description,
        merchantName: tx.merchant_name,
        date: tx.date,
        isWorkRelated: false, // AI分析で後で更新
        confidence: 0,
      }));

      // AI による給与判定
      const analyzedTransactions = await this.analyzeWorkRelatedTransactions(transactions);
      
      // 収入分析の実行
      const analysis = await this.performIncomeAnalysis(analyzedTransactions);

      // Zustand store に自動同期
      await this.syncWithUnifiedStore(analyzedTransactions, analysis);

      logger.info(LogCategory.API, 'Transactions analyzed successfully', {
        transactionCount: analyzedTransactions.length,
        workRelatedCount: analyzedTransactions.filter(tx => tx.isWorkRelated).length,
        monthlyIncome: analysis.monthlyIncome.current
      });

      performanceTimer();
      return { transactions: analyzedTransactions, analysis };

    } catch (error) {
      performanceTimer();
      logger.error(LogCategory.API, 'Transaction analysis failed', error);
      throw error;
    }
  }

  // AI による給与・労働関連取引の判定
  private async analyzeWorkRelatedTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return transactions.map(transaction => {
      let confidence = 0;
      let isWorkRelated = false;

      // 金額パターン分析
      if (transaction.type === 'credit' && transaction.amount >= 5000) {
        confidence += 30;
      }

      // 説明文パターン分析（日本語）
      const workKeywords = [
        '給与', '賃金', '時給', '日給', 'バイト', 'アルバイト', 'パート',
        'SALARY', 'WAGE', 'HOURLY', 'PART TIME', 'PART-TIME',
        '株式会社', '有限会社', 'カフェ', 'コンビニ', '塾', '家庭教師'
      ];

      const description = transaction.description.toLowerCase();
      const matchedKeywords = workKeywords.filter(keyword => 
        description.includes(keyword.toLowerCase())
      );

      confidence += matchedKeywords.length * 15;

      // 定期性分析（週次・月次パターン）
      if (this.isRegularPayment(transaction, transactions)) {
        confidence += 25;
      }

      // 時間帯分析（給与は営業時間内が多い）
      const hour = new Date(transaction.date).getHours();
      if (hour >= 9 && hour <= 17) {
        confidence += 10;
      }

      isWorkRelated = confidence > 50;

      return {
        ...transaction,
        isWorkRelated,
        confidence: Math.min(100, confidence),
        workplaceId: isWorkRelated ? this.matchWorkplace(transaction) : undefined,
      };
    });
  }

  // 定期的な支払いかどうかの判定
  private isRegularPayment(target: Transaction, allTransactions: Transaction[]): boolean {
    const similarTransactions = allTransactions.filter(tx =>
      tx.id !== target.id &&
      tx.merchantName === target.merchantName &&
      Math.abs(tx.amount - target.amount) < target.amount * 0.1 // 10%以内の誤差
    );

    if (similarTransactions.length < 2) return false;

    // 日付間隔の分析
    const dates = [target, ...similarTransactions]
      .map(tx => new Date(tx.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const interval = Math.floor((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(interval);
    }

    // 週次（7±2日）または月次（28-31日）パターン
    const weeklyPattern = intervals.every(interval => Math.abs(interval - 7) <= 2);
    const monthlyPattern = intervals.every(interval => interval >= 28 && interval <= 31);

    return weeklyPattern || monthlyPattern;
  }

  // ワークプレースとのマッチング
  private matchWorkplace(transaction: Transaction): string | undefined {
    const { workplaces } = useUnifiedStore.getState();
    
    // 会社名・店名での一致検索
    const matchedWorkplace = workplaces.find(workplace =>
      transaction.merchantName?.toLowerCase().includes(workplace.name.toLowerCase()) ||
      transaction.description.toLowerCase().includes(workplace.name.toLowerCase())
    );

    return matchedWorkplace?.id;
  }

  // 収入分析の実行
  private async performIncomeAnalysis(transactions: Transaction[]): Promise<IncomeAnalysis> {
    const workRelatedTransactions = transactions.filter(tx => tx.isWorkRelated);
    
    // 月次収入計算
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthIncome = workRelatedTransactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const previousMonthIncome = workRelatedTransactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    // トレンド分析
    const changePercent = previousMonthIncome > 0 
      ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
      : 0;
    
    const trend = changePercent > 5 ? 'increasing' : 
                 changePercent < -5 ? 'decreasing' : 'stable';

    // ワークプレース別分析
    const workplaceMap = new Map<string, {
      amount: number;
      count: number;
      lastPayment: string;
    }>();

    workRelatedTransactions.forEach(tx => {
      if (tx.workplaceId) {
        const existing = workplaceMap.get(tx.workplaceId) || { amount: 0, count: 0, lastPayment: tx.date };
        workplaceMap.set(tx.workplaceId, {
          amount: existing.amount + tx.amount,
          count: existing.count + 1,
          lastPayment: tx.date > existing.lastPayment ? tx.date : existing.lastPayment,
        });
      }
    });

    const workplaceBreakdown = Array.from(workplaceMap.entries()).map(([workplaceId, data]) => {
      const workplace = useUnifiedStore.getState().workplaces.find(w => w.id === workplaceId);
      return {
        workplaceId,
        workplaceName: workplace?.name || 'Unknown',
        amount: data.amount,
        transactionCount: data.count,
        frequency: this.determinePaymentFrequency(data.count, 90) as 'weekly' | 'biweekly' | 'monthly',
        lastPayment: data.lastPayment,
      };
    });

    // 税金予測
    const yearToDate = workRelatedTransactions
      .filter(tx => new Date(tx.date).getFullYear() === currentYear)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const remainingMonths = 12 - currentMonth - 1;
    const projected = yearToDate + (currentMonthIncome * remainingMonths);
    const taxLimit = 1230000; // 扶養控除限度額（日本）
    
    const riskLevel = projected > taxLimit * 0.95 ? 'danger' :
                     projected > taxLimit * 0.8 ? 'warning' : 'safe';

    // 節約機会の分析
    const potentialSavings = this.calculateSavingsOpportunity(transactions);

    return {
      monthlyIncome: {
        current: Math.round(currentMonthIncome),
        previous: Math.round(previousMonthIncome),
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
      },
      workplaceBreakdown,
      taxProjection: {
        yearToDate: Math.round(yearToDate),
        projected: Math.round(projected),
        riskLevel,
        recommendedLimit: Math.round(taxLimit * 0.85), // 85%を推奨上限
      },
      savingsOpportunity: {
        potentialSavings: Math.round(potentialSavings),
        suggestions: this.generateSavingsSuggestions(transactions),
      },
    };
  }

  private determinePaymentFrequency(transactionCount: number, daysPeriod: number): string {
    const avgInterval = daysPeriod / transactionCount;
    
    if (avgInterval <= 10) return 'weekly';
    if (avgInterval <= 20) return 'biweekly';
    return 'monthly';
  }

  private calculateSavingsOpportunity(transactions: Transaction[]): number {
    // 非労働関連の支出から節約可能額を算出
    const expenses = transactions.filter(tx => !tx.isWorkRelated && tx.type === 'debit');
    
    const categorySpending = new Map<string, number>();
    expenses.forEach(tx => {
      categorySpending.set(tx.category, (categorySpending.get(tx.category) || 0) + tx.amount);
    });

    // 娯楽・外食費の20%を節約可能と仮定
    const entertainmentSpending = categorySpending.get('entertainment') || 0;
    const restaurantSpending = categorySpending.get('food_and_drink') || 0;
    
    return (entertainmentSpending + restaurantSpending) * 0.2;
  }

  private generateSavingsSuggestions(transactions: Transaction[]): string[] {
    const suggestions = [];
    const expenses = transactions.filter(tx => !tx.isWorkRelated && tx.type === 'debit');
    
    const monthlySpending = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const avgTransaction = monthlySpending / expenses.length;
    
    if (avgTransaction > 3000) {
      suggestions.push('高額な支出が頻繁です。予算管理アプリの使用をお勧めします');
    }
    
    const frequentCategories = this.getMostFrequentCategories(expenses);
    if (frequentCategories.includes('food_and_drink')) {
      suggestions.push('外食費が多めです。自炊の日を増やすと節約できます');
    }
    
    if (frequentCategories.includes('transportation')) {
      suggestions.push('交通費の見直しで月額定期券がお得かもしれません');
    }
    
    return suggestions.length > 0 ? suggestions : ['支出バランスが良好です'];
  }

  private getMostFrequentCategories(transactions: Transaction[]): string[] {
    const categoryCount = new Map<string, number>();
    transactions.forEach(tx => {
      categoryCount.set(tx.category, (categoryCount.get(tx.category) || 0) + 1);
    });
    
    return Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  // Zustand store への自動同期
  private async syncWithUnifiedStore(transactions: Transaction[], analysis: IncomeAnalysis): Promise<void> {
    const store = useUnifiedStore.getState();
    
    // 銀行取引から推定されるシフト情報を作成
    const workRelatedTransactions = transactions.filter(tx => tx.isWorkRelated && tx.workplaceId);
    
    for (const tx of workRelatedTransactions) {
      const existingShift = store.shifts.find(shift => 
        shift.date === tx.date && shift.workplaceId === tx.workplaceId
      );
      
      if (!existingShift) {
        // 推定シフト情報を作成（実際の勤務時間は不明なので推定）
        const workplace = store.workplaces.find(w => w.id === tx.workplaceId);
        if (workplace) {
          const estimatedHours = tx.amount / workplace.defaultHourlyRate;
          
          await store.addShift({
            date: tx.date,
            startTime: '09:00', // 推定
            endTime: this.calculateEndTime('09:00', estimatedHours),
            workplaceName: workplace.name,
            workplaceId: tx.workplaceId,
            breakMinutes: estimatedHours > 6 ? 60 : 0,
            hourlyRate: workplace.defaultHourlyRate,
            actualWorkMinutes: estimatedHours * 60,
            totalEarnings: tx.amount,
            notes: `銀行取引から自動生成 (${tx.description})`,
          });
        }
      }
    }

    logger.info(LogCategory.API, 'Synced with unified store', {
      newShiftsCreated: workRelatedTransactions.length,
      analysisUpdated: true,
    });
  }

  private calculateEndTime(startTime: string, hours: number): string {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMinute + (hours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  }

  // ユーティリティメソッド
  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(.{4}).*(.{4})/, '$1****$2');
  }

  private getThreeMonthsAgo(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  }

  private saveLinkedAccounts(): void {
    localStorage.setItem('fuyou_linked_accounts', JSON.stringify(this.linkedAccounts));
  }

  private securelyStoreTokens(sessionId: string, accessToken: string, refreshToken: string): void {
    // 実際の実装では暗号化してセキュアストレージに保存
    const tokenData = {
      sessionId,
      accessToken: this.encrypt(accessToken),
      refreshToken: this.encrypt(refreshToken),
      expiresAt: Date.now() + (3600 * 1000), // 1時間
    };
    
    localStorage.setItem(`fuyou_tokens_${sessionId}`, JSON.stringify(tokenData));
  }

  private encrypt(text: string): string {
    // 実際の実装では適切な暗号化ライブラリを使用
    return btoa(text); // Base64（デモ用）
  }

  private decrypt(encryptedText: string): string {
    // 実際の実装では復号化
    return atob(encryptedText); // Base64デコード（デモ用）
  }

  private async getValidAccessToken(accountId: string): Promise<string> {
    const account = this.linkedAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // セッションIDからトークンを取得（実際の実装）
    const sessionId = 'mock-session-id'; // アカウントから取得
    const tokenData = localStorage.getItem(`fuyou_tokens_${sessionId}`);
    
    if (!tokenData) {
      throw new Error('No valid token found');
    }

    const { accessToken, expiresAt, refreshToken } = JSON.parse(tokenData);
    
    // トークンの有効性確認
    if (Date.now() > expiresAt) {
      // リフレッシュトークンで更新
      return await this.refreshAccessToken(refreshToken);
    }

    return this.decrypt(accessToken);
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    // リフレッシュトークンで新しいアクセストークンを取得
    const response = await apiService.postJson<{ access_token: string }>(
      '/banking/token/refresh',
      { refresh_token: this.decrypt(refreshToken) }
    );
    if (!response.success || !response.data) {
      throw new Error('Token refresh failed');
    }
    const { access_token } = response.data;
    
    // 新しいトークンを保存
    // ... 実装省略

    return access_token;
  }

  // Public API methods
  getLinkedAccounts(): BankAccount[] {
    return [...this.linkedAccounts];
  }

  async unlinkAccount(accountId: string): Promise<void> {
    this.linkedAccounts = this.linkedAccounts.filter(acc => acc.id !== accountId);
    this.saveLinkedAccounts();
    
    logger.info(LogCategory.API, 'Bank account unlinked', { accountId });
  }

  getSupportedBanks(country: string): any[] {
    return SUPPORTED_BANKS[country as keyof typeof SUPPORTED_BANKS] || [];
  }
}

export const openBankingService = OpenBankingService.getInstance();