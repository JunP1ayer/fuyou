// 扶養プロ - 設定ファイル
const CONFIG = {
    // 環境設定
    environment: 'development', // 'development' | 'production'
    
    // API設定
    api: {
        // OpenAI設定
        openai: {
            apiKey: null, // 実際のAPIキーを設定してください
            model: 'gpt-4o',
            maxTokens: 2000,
            temperature: 0.1,
            enabled: false // APIキー設定後にtrueに変更
        },
        
        // Gemini設定
        gemini: {
            apiKey: null, // Geminiキー未設定時はモック使用
            model: 'gemini-pro-vision',
            enabled: false // OpenAI優先、Geminiはフォールバック
        },
        
        // フォールバック設定
        fallback: {
            enableMockService: true,
            mockDataVariation: true,
            preferOpenAI: true // OpenAIを優先使用
        }
    },
    
    // 扶養制度設定（2025年度）
    fuyou: {
        dependentLimit: 1030000,        // 扶養控除限度額
        socialInsuranceLimit: 1060000,  // 社会保険料免除限度額
        municipalTaxLimit: 1000000,     // 住民税非課税限度額
        warningThreshold: 0.9,          // 警告レベル (90%)
        dangerThreshold: 0.95,          // 危険レベル (95%)
        
        // 学生特別控除
        studentDeduction: 270000,       // 勤労学生控除
        basicDeduction: 380000          // 基礎控除
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

// グローバル設定として公開
if (typeof window !== 'undefined') {
    window.FUYOU_CONFIG = CONFIG;
    window.updateConfig = updateConfig;
    window.resetConfig = resetConfig;
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