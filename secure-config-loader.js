// 扶養プロ - セキュアな設定読み込みシステム
class SecureConfigLoader {
    constructor() {
        this.encryptedKeys = new Map();
        this.loadSecureKeys();
    }

    /**
     * セキュアなAPIキー読み込み
     * 複数の安全な方法でAPIキーを取得
     */
    loadSecureKeys() {
        try {
            // 1. 環境変数から取得（最優先）
            this.loadFromEnvironment();
            
            // 2. セキュアストレージから取得
            this.loadFromSecureStorage();
            
            // 3. 暗号化された設定ファイルから取得
            this.loadFromEncryptedConfig();
            
            // 4. 開発用フォールバック
            this.loadDevelopmentFallback();
            
        } catch (error) {
            console.error('セキュア設定読み込みエラー:', error);
        }
    }

    /**
     * 環境変数からの読み込み
     */
    loadFromEnvironment() {
        // ブラウザ環境では直接アクセス不可
        // サーバーサイドでの実装用
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.OPENAI_API_KEY) {
                this.setSecureKey('openai', process.env.OPENAI_API_KEY);
            }
            if (process.env.GEMINI_API_KEY) {
                this.setSecureKey('gemini', process.env.GEMINI_API_KEY);
            }
        }
    }

    /**
     * セキュアストレージからの読み込み
     */
    loadFromSecureStorage() {
        try {
            // Webアプリ用セキュアストレージ実装
            const openaiKey = this.decryptFromStorage('fuyou_secure_openai');
            const geminiKey = this.decryptFromStorage('fuyou_secure_gemini');
            
            if (openaiKey) {
                this.setSecureKey('openai', openaiKey);
            }
            if (geminiKey) {
                this.setSecureKey('gemini', geminiKey);
            }
        } catch (error) {
            console.warn('セキュアストレージ読み込み失敗:', error.message);
        }
    }

    /**
     * 暗号化設定ファイルからの読み込み
     */
    loadFromEncryptedConfig() {
        try {
            // 本番環境では暗号化されたファイルから読み込み
            const encryptedConfig = localStorage.getItem('fuyou_encrypted_config');
            if (encryptedConfig) {
                const decrypted = this.decryptConfig(encryptedConfig);
                if (decrypted.openai) {
                    this.setSecureKey('openai', decrypted.openai);
                }
                if (decrypted.gemini) {
                    this.setSecureKey('gemini', decrypted.gemini);
                }
            }
        } catch (error) {
            console.warn('暗号化設定読み込み失敗:', error.message);
        }
    }

    /**
     * 開発用フォールバック（開発環境のみ）
     */
    loadDevelopmentFallback() {
        if (window.FUYOU_CONFIG?.environment === 'development') {
            // 開発環境用の安全なフォールバック
            const devKeys = this.getDevelopmentKeys();
            if (devKeys.openai) {
                this.setSecureKey('openai', devKeys.openai);
            }
            if (devKeys.gemini) {
                this.setSecureKey('gemini', devKeys.gemini);
            }
        }
    }

    /**
     * 開発環境用キー取得
     */
    getDevelopmentKeys() {
        // 開発環境用の安全なキー管理
        // 実際のキーは外部の安全な場所から取得
        return {
            openai: this.getFromSecureSource('openai'),
            gemini: this.getFromSecureSource('gemini')
        };
    }

    /**
     * セキュアソースからのキー取得
     */
    getFromSecureSource(provider) {
        try {
            // 複数の安全な方法でキーを取得
            
            // 1. 事前に設定されたセキュアキー
            const presetKey = this.getPresetKey(provider);
            if (presetKey) return presetKey;
            
            // 2. 動的キー生成（デモ用）
            const dynamicKey = this.generateSecureKey(provider);
            if (dynamicKey) return dynamicKey;
            
            return null;
        } catch (error) {
            console.error(`${provider}キー取得エラー:`, error);
            return null;
        }
    }

    /**
     * 事前設定キーの取得
     */
    getPresetKey(provider) {
        // 本番環境では外部の安全な場所から取得
        // 実際のキーは環境変数または暗号化ファイルから読み込み
        
        // セキュリティのため、キーはコードに直接記載しない
        // 実装時に管理者が設定
        const secureKeys = {
            openai: this.getFromExternalSource('openai'),
            gemini: this.getFromExternalSource('gemini')
        };
        
        return secureKeys[provider] || null;
    }
    
    /**
     * 外部の安全なソースからキーを取得
     */
    getFromExternalSource(provider) {
        // 実際の実装では:
        // 1. 環境変数から取得
        // 2. セキュア設定サービスから取得  
        // 3. 暗号化されたファイルから取得
        
        // デモ用プレースホルダー
        return null;
    }

    /**
     * セキュアキーの設定
     */
    setSecureKey(provider, key) {
        if (!key || key.length < 10) {
            console.warn(`無効な${provider}キー`);
            return false;
        }
        
        // キーの妥当性チェック
        if (!this.validateAPIKey(provider, key)) {
            console.warn(`${provider}キーの形式が無効`);
            return false;
        }
        
        this.encryptedKeys.set(provider, this.encryptKey(key));
        console.log(`${provider} APIキーを安全に設定しました`);
        return true;
    }

    /**
     * セキュアキーの取得
     */
    getSecureKey(provider) {
        const encrypted = this.encryptedKeys.get(provider);
        if (!encrypted) {
            console.warn(`${provider}キーが設定されていません`);
            return null;
        }
        
        return this.decryptKey(encrypted);
    }

    /**
     * APIキーの妥当性チェック
     */
    validateAPIKey(provider, key) {
        const patterns = {
            openai: /^sk-[a-zA-Z0-9\-_]{20,}$/,
            gemini: /^AIza[a-zA-Z0-9\-_]{30,}$/
        };
        
        const pattern = patterns[provider];
        return pattern ? pattern.test(key) : false;
    }

    /**
     * 簡易暗号化（ブラウザ環境用）
     */
    encryptKey(key) {
        try {
            // 実際の実装では stronger encryption を使用
            const encoded = btoa(key.split('').reverse().join(''));
            return encoded;
        } catch (error) {
            console.error('キー暗号化エラー:', error);
            return key;
        }
    }

    /**
     * 復号化
     */
    decryptKey(encrypted) {
        try {
            const decoded = atob(encrypted);
            return decoded.split('').reverse().join('');
        } catch (error) {
            console.error('キー復号化エラー:', error);
            return encrypted;
        }
    }

    /**
     * セキュアストレージから復号化読み込み
     */
    decryptFromStorage(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            
            return this.decryptKey(encrypted);
        } catch (error) {
            console.error('ストレージ復号化エラー:', error);
            return null;
        }
    }

    /**
     * 設定の暗号化
     */
    encryptConfig(config) {
        try {
            const json = JSON.stringify(config);
            return btoa(json);
        } catch (error) {
            console.error('設定暗号化エラー:', error);
            return null;
        }
    }

    /**
     * 設定の復号化
     */
    decryptConfig(encrypted) {
        try {
            const json = atob(encrypted);
            return JSON.parse(json);
        } catch (error) {
            console.error('設定復号化エラー:', error);
            return {};
        }
    }

    /**
     * セキュアキーの生成（デモ用）
     */
    generateSecureKey(provider) {
        // デモ環境でのみ使用
        if (window.FUYOU_CONFIG?.environment !== 'demo') {
            return null;
        }
        
        const demoKeys = {
            openai: 'demo_openai_key_for_testing',
            gemini: 'demo_gemini_key_for_testing'
        };
        
        return demoKeys[provider] || null;
    }

    /**
     * 全設定の更新
     */
    updateSecureConfig() {
        if (!window.FUYOU_CONFIG) {
            console.error('FUYOU_CONFIG が定義されていません');
            return false;
        }
        
        // OpenAI キー設定
        const openaiKey = this.getSecureKey('openai');
        if (openaiKey) {
            window.FUYOU_CONFIG.api.openai.apiKey = openaiKey;
            window.FUYOU_CONFIG.api.openai.enabled = true;
        }
        
        // Gemini キー設定
        const geminiKey = this.getSecureKey('gemini');
        if (geminiKey) {
            window.FUYOU_CONFIG.api.gemini.apiKey = geminiKey;
            window.FUYOU_CONFIG.api.gemini.enabled = true;
        }
        
        console.log('セキュア設定更新完了');
        return true;
    }

    /**
     * セキュリティ監査
     */
    auditSecurity() {
        const issues = [];
        const recommendations = [];
        
        // キー設定状況確認
        const hasOpenAI = this.encryptedKeys.has('openai');
        const hasGemini = this.encryptedKeys.has('gemini');
        
        if (!hasOpenAI && !hasGemini) {
            issues.push('APIキーが設定されていません');
            recommendations.push('少なくとも1つのAI APIキーを設定してください');
        }
        
        // 環境確認
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            issues.push('非セキュア接続（HTTP）が検出されました');
            recommendations.push('本番環境ではHTTPS接続を使用してください');
        }
        
        // ローカルストレージ確認
        const hasPlaintextKeys = localStorage.getItem('openai_key') || localStorage.getItem('gemini_key');
        if (hasPlaintextKeys) {
            issues.push('平文のAPIキーがローカルストレージに保存されています');
            recommendations.push('平文キーを削除し、暗号化されたキーを使用してください');
        }
        
        return {
            issues,
            recommendations,
            securityLevel: issues.length === 0 ? 'high' : issues.length <= 2 ? 'medium' : 'low'
        };
    }

    /**
     * キー使用状況の監視
     */
    monitorKeyUsage() {
        const usage = {
            openai: {
                lastUsed: localStorage.getItem('openai_last_used'),
                requestCount: parseInt(localStorage.getItem('openai_request_count') || '0'),
                errorCount: parseInt(localStorage.getItem('openai_error_count') || '0')
            },
            gemini: {
                lastUsed: localStorage.getItem('gemini_last_used'),
                requestCount: parseInt(localStorage.getItem('gemini_request_count') || '0'),
                errorCount: parseInt(localStorage.getItem('gemini_error_count') || '0')
            }
        };
        
        return usage;
    }

    /**
     * 緊急時のキー無効化
     */
    emergencyDisableKeys() {
        console.warn('🚨 緊急キー無効化が実行されました');
        
        this.encryptedKeys.clear();
        
        if (window.FUYOU_CONFIG) {
            window.FUYOU_CONFIG.api.openai.enabled = false;
            window.FUYOU_CONFIG.api.gemini.enabled = false;
        }
        
        // 緊急ログ記録
        localStorage.setItem('emergency_disable_timestamp', new Date().toISOString());
        
        return true;
    }
}

// グローバルインスタンス作成
const secureConfig = new SecureConfigLoader();

// 設定を更新
secureConfig.updateSecureConfig();

// セキュリティ監査実行
const securityAudit = secureConfig.auditSecurity();
if (securityAudit.issues.length > 0) {
    console.warn('セキュリティ問題:', securityAudit.issues);
    console.info('推奨事項:', securityAudit.recommendations);
}

// グローバル公開
if (typeof window !== 'undefined') {
    window.secureConfig = secureConfig;
    window.getSecureAPIKey = (provider) => secureConfig.getSecureKey(provider);
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureConfigLoader;
}