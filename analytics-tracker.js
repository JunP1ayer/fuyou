// 扶養プロ - プライバシー重視の分析トラッカー
class AnalyticsTracker {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        
        // プライバシー設定
        this.privacyMode = true; // デフォルトで個人情報は収集しない
        this.consentGiven = false;
        
        // 使用パターン分析用
        this.featureUsage = {
            manualEntry: 0,
            aiScan: 0,
            optimization: 0,
            export: 0,
            backup: 0
        };
        
        // エラー追跡
        this.errors = [];
        
        this.init();
    }

    init() {
        // 既存の同意状態を確認
        this.consentGiven = localStorage.getItem('analytics_consent') === 'true';
        
        if (this.consentGiven) {
            this.startTracking();
        }
    }

    startTracking() {
        // ページビュー
        this.trackPageView();
        
        // セッション情報
        this.trackSession();
        
        // エラー監視
        this.setupErrorTracking();
        
        // パフォーマンス監視
        this.setupPerformanceTracking();
        
        // 定期的な使用状況送信（5分ごと）
        this.startPeriodicReporting();
    }

    trackEvent(category, action, label = null, value = null) {
        if (!this.consentGiven) return;
        
        const event = {
            timestamp: Date.now(),
            category,
            action,
            label,
            value,
            sessionId: this.sessionId
        };
        
        this.events.push(event);
        
        // 特定の機能使用をカウント
        if (category === 'feature_use') {
            if (this.featureUsage[action] !== undefined) {
                this.featureUsage[action]++;
            }
        }
        
        // リアルタイム送信（重要なイベントのみ）
        if (this.isImportantEvent(category, action)) {
            this.sendEvent(event);
        }
    }

    trackPageView(page = window.location.pathname) {
        this.trackEvent('page_view', page, document.title);
    }

    trackSession() {
        const sessionData = {
            start: this.startTime,
            platform: this.detectPlatform(),
            screenSize: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || 'direct'
        };
        
        this.trackEvent('session', 'start', JSON.stringify(sessionData));
    }

    trackFeatureUsage(feature, details = {}) {
        this.trackEvent('feature_use', feature, JSON.stringify(details));
        
        // 使用パターン分析
        this.analyzeUsagePattern(feature, details);
    }

    trackError(error, context = {}) {
        const errorData = {
            message: error.message || String(error),
            stack: error.stack,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };
        
        this.errors.push(errorData);
        
        // 重大なエラーは即座に送信
        if (this.isCriticalError(error)) {
            this.sendError(errorData);
        }
    }

    trackPerformance(metric, value, unit = 'ms') {
        this.trackEvent('performance', metric, unit, value);
        
        // パフォーマンス問題の検出
        if (this.isPerformanceIssue(metric, value)) {
            this.notifyPerformanceIssue(metric, value);
        }
    }

    // AI使用状況の詳細追跡
    trackAIUsage(provider, success, processingTime, errorMessage = null) {
        const aiData = {
            provider,
            success,
            processingTime,
            errorMessage,
            timestamp: Date.now()
        };
        
        this.trackEvent('ai_usage', success ? 'success' : 'failure', JSON.stringify(aiData));
        
        // コスト計算
        if (success) {
            this.estimateAICost(provider);
        }
    }

    // ユーザー行動パターン分析
    analyzeUsagePattern(feature, details) {
        const patterns = {
            powerUser: this.featureUsage.aiScan > 10 && this.featureUsage.optimization > 5,
            casualUser: Object.values(this.featureUsage).reduce((a, b) => a + b, 0) < 10,
            dataFocused: this.featureUsage.export > 5 || this.featureUsage.backup > 3
        };
        
        // パターンに基づく推奨機能
        if (patterns.powerUser && !this.hasRecommended('premium')) {
            this.recommendFeature('premium', 'プレミアム機能で更に効率化');
        }
    }

    // プライバシー保護されたユーザーID生成
    generateUserId() {
        const data = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            window.screen.width,
            window.screen.height
        ].join('|');
        
        return this.hashString(data);
    }

    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // 同意管理
    requestConsent() {
        const modal = document.createElement('div');
        modal.className = 'analytics-consent-modal';
        modal.innerHTML = `
            <div class="consent-content">
                <h3>📊 アプリの改善にご協力ください</h3>
                <p>扶養プロをより使いやすくするため、匿名の使用データを収集させていただけますか？</p>
                <ul>
                    <li>✅ 個人情報は一切収集しません</li>
                    <li>✅ シフトデータは送信されません</li>
                    <li>✅ いつでも無効化できます</li>
                </ul>
                <div class="consent-buttons">
                    <button onclick="analytics.acceptConsent()">同意する</button>
                    <button onclick="analytics.declineConsent()">同意しない</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    acceptConsent() {
        this.consentGiven = true;
        localStorage.setItem('analytics_consent', 'true');
        this.startTracking();
        document.querySelector('.analytics-consent-modal')?.remove();
    }

    declineConsent() {
        this.consentGiven = false;
        localStorage.setItem('analytics_consent', 'false');
        document.querySelector('.analytics-consent-modal')?.remove();
    }

    // データ送信（実装例）
    async sendAnalytics(data) {
        if (!this.consentGiven) return;
        
        // プライバシー保護: 個人情報を除去
        const sanitizedData = this.sanitizeData(data);
        
        try {
            // 実際の送信先エンドポイントに置き換える
            if (window.ANALYTICS_ENDPOINT) {
                await fetch(window.ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.generateUserId(),
                        sessionId: this.sessionId,
                        data: sanitizedData
                    })
                });
            } else {
                // ローカルストレージに保存（オフライン対応）
                this.saveToLocalStorage(sanitizedData);
            }
        } catch (error) {
            console.warn('Analytics送信エラー:', error);
        }
    }

    // プライバシー保護のためのデータサニタイズ
    sanitizeData(data) {
        const sanitized = JSON.parse(JSON.stringify(data));
        
        // 個人情報の可能性があるフィールドを除去
        const sensitiveFields = ['email', 'name', 'phone', 'address', 'apiKey'];
        
        const removeSensitive = (obj) => {
            for (const key in obj) {
                if (sensitiveFields.includes(key.toLowerCase())) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    removeSensitive(obj[key]);
                }
            }
        };
        
        removeSensitive(sanitized);
        return sanitized;
    }

    // ユーティリティ関数
    detectPlatform() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        if (/Windows/.test(ua)) return 'Windows';
        if (/Mac/.test(ua)) return 'Mac';
        return 'Other';
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    isImportantEvent(category, action) {
        const important = ['error', 'purchase', 'signup', 'ai_usage'];
        return important.includes(category);
    }

    isCriticalError(error) {
        return error.message && (
            error.message.includes('API') ||
            error.message.includes('データ損失') ||
            error.message.includes('認証')
        );
    }

    isPerformanceIssue(metric, value) {
        const thresholds = {
            'page_load': 3000,
            'api_response': 2000,
            'ai_processing': 5000
        };
        return thresholds[metric] && value > thresholds[metric];
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackError(event.error || event.message, {
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(event.reason, {
                type: 'unhandledRejection'
            });
        });
    }

    setupPerformanceTracking() {
        // ページロード時間
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.trackPerformance('page_load', loadTime);
        });

        // First Contentful Paint
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.trackPerformance('fcp', entry.startTime);
                }
            }
        });
        
        try {
            observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
            // PerformanceObserver not supported
        }
    }

    startPeriodicReporting() {
        setInterval(() => {
            if (this.events.length > 0) {
                this.sendAnalytics({
                    events: this.events.splice(0, 50), // 最大50イベント
                    featureUsage: this.featureUsage,
                    sessionDuration: Date.now() - this.startTime
                });
            }
        }, 5 * 60 * 1000); // 5分ごと
    }

    // ローカルストレージ保存（オフライン対応）
    saveToLocalStorage(data) {
        const stored = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
        stored.push({
            timestamp: Date.now(),
            data
        });
        
        // 最大100件まで保存
        if (stored.length > 100) {
            stored.splice(0, stored.length - 100);
        }
        
        localStorage.setItem('analytics_queue', JSON.stringify(stored));
    }

    // レポート生成（開発者用）
    generateReport() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            eventsCount: this.events.length,
            featureUsage: this.featureUsage,
            errorsCount: this.errors.length,
            platform: this.detectPlatform()
        };
    }
}

// グローバルインスタンス
const analytics = new AnalyticsTracker();

// 便利なショートカット関数
window.trackEvent = (category, action, label, value) => {
    analytics.trackEvent(category, action, label, value);
};

window.trackFeature = (feature, details) => {
    analytics.trackFeatureUsage(feature, details);
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsTracker;
}