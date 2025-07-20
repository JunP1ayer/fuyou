// 扶養プロ - 設定ファイル
const CONFIG = {
    // 環境設定
    environment: 'development', // 'development' | 'production'
    
    // API設定
    api: {
        // OpenAI設定
        openai: {
            apiKey: null, // 環境変数から取得
            model: 'gpt-4o',
            maxTokens: 2000,
            temperature: 0.1,
            enabled: true // 完全無料提供
        },
        
        // Gemini設定
        gemini: {
            apiKey: null, // 環境変数から取得
            model: 'gemini-pro-vision',
            enabled: true // Gemini も利用可能
        },
        
        // フォールバック設定
        fallback: {
            enableMockService: false, // 実APIのみ使用
            mockDataVariation: false,
            preferOpenAI: true // OpenAIを優先使用
        }
    },
    
    // 扶養制度設定（2025年税制改正対応）
    fuyou: {
        // 2025年新制度
        basicDependentLimit: 1230000,    // 基本扶養控除限度額（123万円）
        studentDependentLimit: 1500000,  // 学生扶養控除限度額（150万円・19-22歳）
        studentWorkingLimit: 1500000,    // 勤労学生控除限度額（150万円）
        specialDependentStart: 1230000,  // 特定親族特別控除開始額（123万円）
        specialDependentEnd: 1500000,    // 特定親族特別控除終了額（150万円）
        
        // 旧制度（後方互換性のため）
        legacyDependentLimit: 1030000,   // 旧扶養控除限度額（103万円）
        
        // その他の限度額
        socialInsuranceLimit: 1060000,  // 社会保険料免除限度額
        municipalTaxLimit: 1000000,     // 住民税非課税限度額
        
        // アラート設定
        warningThreshold: 0.8,          // 警告レベル (80%)
        dangerThreshold: 0.95,          // 危険レベル (95%)
        
        // 控除額
        studentDeduction: 270000,       // 勤労学生控除
        basicDeduction: 380000,         // 基礎控除
        specialFamilyDeduction: 630000  // 特定扶養控除（19-22歳）
    },
    
    // PWA設定
    pwa: {
        enableServiceWorker: true,
        enablePushNotifications: true,
        enableBackgroundSync: true,
        cacheStrategy: 'CacheFirst', // 'CacheFirst' | 'NetworkFirst'
        offlineEnabled: true
    },
    
    // UI設定
    ui: {
        theme: 'light', // 'light' | 'dark' | 'auto'
        language: 'ja',
        enableHapticFeedback: true,
        enableSoundFeedback: false,
        animationDuration: 300,
        
        // モバイル最適化
        mobile: {
            enableSwipeGestures: true,
            enablePullToRefresh: true,
            enableFloatingActionButton: true,
            bottomSafeArea: 20
        }
    },
    
    // データ設定
    data: {
        autoSave: true,
        autoSaveInterval: 30000, // 30秒
        maxHistoryItems: 50,
        enableDataExport: true,
        enableDataImport: true,
        
        // バックアップ設定
        backup: {
            enabled: true,
            interval: 86400000, // 24時間
            maxBackups: 7
        }
    },
    
    // セキュリティ設定
    security: {
        enableEncryption: false, // 本番環境では true に設定
        sessionTimeout: 3600000, // 1時間
        maxFailedAttempts: 5,
        enableBiometric: false
    },
    
    // 分析・追跡設定
    analytics: {
        enabled: false, // プライバシー重視のためデフォルトはfalse
        provider: null, // 'google' | 'mixpanel' | null
        trackingId: null,
        enableCrashReporting: false
    },
    
    // デバッグ設定
    debug: {
        enableConsoleLog: true,
        enablePerformanceMonitoring: true,
        enableErrorReporting: true,
        showDebugInfo: false
    },
    
    // 通知設定
    notifications: {
        fuyouWarning: {
            enabled: true,
            threshold: 0.9,
            dailyCheck: true,
            weeklyReport: true
        },
        
        shiftReminder: {
            enabled: true,
            beforeHours: 2,
            recurringReminder: false
        }
    },
    
    // 機能フラグ
    features: {
        aiAnalysis: true,
        multipleWorkplaces: true,
        optimizationEngine: true,
        exportData: true,
        socialSharing: false,
        collaborativeShifts: false, // 将来機能
        bankingIntegration: false   // 将来機能
    }
};

// 環境別設定オーバーライド
if (CONFIG.environment === 'production') {
    // 本番環境設定
    CONFIG.debug.enableConsoleLog = false;
    CONFIG.debug.showDebugInfo = false;
    CONFIG.analytics.enabled = true; // ユーザー同意があれば
    CONFIG.security.enableEncryption = true;
    CONFIG.api.fallback.enableMockService = false;
}

// 設定バリデーション
function validateConfig() {
    const errors = [];
    
    // API キー設定チェック
    if (!CONFIG.api.openai.apiKey && !CONFIG.api.gemini.apiKey && !CONFIG.api.fallback.enableMockService) {
        errors.push('AIサービスが利用できません。APIキーを設定するか、モックサービスを有効にしてください。');
    }
    
    // 扶養限度額設定チェック
    if (CONFIG.fuyou.dependentLimit <= 0) {
        errors.push('扶養控除限度額が正しく設定されていません。');
    }
    
    // 通知設定チェック
    if (CONFIG.notifications.fuyouWarning.threshold > 1 || CONFIG.notifications.fuyouWarning.threshold < 0) {
        errors.push('扶養警告閾値は0-1の範囲で設定してください。');
    }
    
    return errors;
}

// 設定の動的更新
function updateConfig(newConfig) {
    try {
        // 設定をマージ
        Object.assign(CONFIG, newConfig);
        
        // ローカルストレージに保存
        localStorage.setItem('fuyou_config', JSON.stringify(CONFIG));
        
        console.log('設定を更新しました:', newConfig);
        return true;
    } catch (error) {
        console.error('設定更新エラー:', error);
        return false;
    }
}

// 設定の読み込み
function loadConfig() {
    try {
        const savedConfig = localStorage.getItem('fuyou_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            Object.assign(CONFIG, parsed);
        }
    } catch (error) {
        console.warn('設定読み込みエラー:', error);
    }
}

// 設定のリセット
function resetConfig() {
    localStorage.removeItem('fuyou_config');
    location.reload();
}

// 初期化時に設定を読み込み
loadConfig();

// バリデーション実行
const configErrors = validateConfig();
if (configErrors.length > 0) {
    console.warn('設定エラー:', configErrors);
}

// 2025年税制に基づく扶養限度額計算
function getDependentLimit(userStatus = null) {
    try {
        // ユーザー設定を取得
        const userSettings = userStatus || JSON.parse(localStorage.getItem('fuyou_user_settings') || '{}');
        const studentStatus = userSettings.studentStatus || 'general';
        
        // 2025年新制度に基づく限度額決定
        switch (studentStatus) {
            case 'student-19-22':
                // 19-22歳の学生：150万円まで扶養控除対象
                return CONFIG.fuyou.studentDependentLimit;
            case 'student-other':
                // その他年齢の学生：123万円まで
                return CONFIG.fuyou.basicDependentLimit;
            case 'general':
            default:
                // 一般（学生以外）：123万円まで
                return CONFIG.fuyou.basicDependentLimit;
        }
    } catch (error) {
        console.warn('ユーザー設定取得エラー、デフォルト値を使用:', error);
        return CONFIG.fuyou.basicDependentLimit;
    }
}

// 税制メリット計算（2025年対応）
function calculateTaxBenefit(income, userStatus = null) {
    const userSettings = userStatus || JSON.parse(localStorage.getItem('fuyou_user_settings') || '{}');
    const studentStatus = userSettings.studentStatus || 'general';
    
    let parentDeduction = 0;
    let studentTax = 0;
    
    if (studentStatus === 'student-19-22') {
        if (income <= CONFIG.fuyou.basicDependentLimit) {
            // 123万円以下：特定扶養控除63万円
            parentDeduction = CONFIG.fuyou.specialFamilyDeduction;
        } else if (income <= CONFIG.fuyou.studentDependentLimit) {
            // 123万円超〜150万円：特定親族特別控除（段階的減額）
            const reductionRate = (income - CONFIG.fuyou.specialDependentStart) / 
                                 (CONFIG.fuyou.specialDependentEnd - CONFIG.fuyou.specialDependentStart);
            parentDeduction = Math.max(0, CONFIG.fuyou.specialFamilyDeduction * (1 - reductionRate * 0.4));
        }
        // 150万円以下なら学生の所得税は0円
        if (income <= CONFIG.fuyou.studentWorkingLimit) {
            studentTax = 0;
        }
    } else {
        if (income <= CONFIG.fuyou.basicDependentLimit) {
            // 一般扶養控除38万円
            parentDeduction = CONFIG.fuyou.basicDeduction;
        }
    }
    
    return {
        parentDeduction,
        studentTax,
        totalBenefit: parentDeduction * 0.3 // 概算節税効果（30%税率）
    };
}

// グローバル設定として公開
if (typeof window !== 'undefined') {
    window.FUYOU_CONFIG = CONFIG;
    window.updateConfig = updateConfig;
    window.resetConfig = resetConfig;
    window.getDependentLimit = getDependentLimit;
    window.calculateTaxBenefit = calculateTaxBenefit;
}

// モジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        updateConfig,
        resetConfig,
        validateConfig
    };
}