// 📝 統合ログシステム - 構造化ログ + ユーザーメッセージ

import toast from 'react-hot-toast';

// ログレベル定義
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// ログエントリの型定義
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

// ユーザーメッセージの設定
interface UserMessage {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// ログカテゴリ
export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  UI = 'ui',
  SYNC = 'sync',
  I18N = 'i18n',
  ANALYTICS = 'analytics',
  SHIFTS = 'shifts',
  FRIENDS = 'friends',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

// セッション管理
class SessionManager {
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  renewSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

// ログ送信キュー
class LogQueue {
  private queue: LogEntry[] = [];
  private maxSize = 100;
  private flushInterval = 30000; // 30秒
  private lastFlush = Date.now();

  add(entry: LogEntry): void {
    this.queue.push(entry);
    
    if (this.queue.length > this.maxSize) {
      this.queue.shift(); // 古いログを削除
    }

    // 自動フラッシュ条件
    if (
      entry.level >= LogLevel.ERROR ||
      this.queue.length >= this.maxSize ||
      Date.now() - this.lastFlush > this.flushInterval
    ) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];
    this.lastFlush = Date.now();

    try {
      // 本番環境では外部ログサービスに送信
      if (process.env.NODE_ENV === 'production') {
        const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
        await fetch(`${API_BASE}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend }),
        });
      } else {
        // 開発環境ではローカルストレージに保存
        const existingLogs = JSON.parse(
          localStorage.getItem('fuyou_debug_logs') || '[]'
        );
        const newLogs = [...existingLogs, ...logsToSend].slice(-500); // 最新500件保持
        localStorage.setItem('fuyou_debug_logs', JSON.stringify(newLogs));
      }
    } catch (error) {
      console.error('Failed to send logs:', error);
      // 送信失敗時はキューに戻す
      this.queue.unshift(...logsToSend);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// メインロガークラス
class Logger {
  private sessionManager: SessionManager;
  private logQueue: LogQueue;
  private userId?: string;

  constructor() {
    this.sessionManager = new SessionManager();
    this.logQueue = new LogQueue();
    
    // ページ離脱時にログを送信
    window.addEventListener('beforeunload', () => {
      this.logQueue.flush();
    });

    // 定期的にログを送信
    setInterval(() => {
      this.logQueue.flush();
    }, 60000); // 1分間隔
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      userId: this.userId,
      sessionId: this.sessionManager.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error?.stack || new Error().stack,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const minLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.WARN 
      : LogLevel.DEBUG;
    return level >= minLevel;
  }

  // 基本ログメソッド
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    error?: Error,
    userMessage?: UserMessage
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, error);
    this.logQueue.add(entry);

    // コンソール出力
    const consoleMessage = `[${LogLevel[level]}] ${category}: ${message}`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, data);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(consoleMessage, error || data);
        break;
    }

    // ユーザーメッセージ表示
    if (userMessage) {
      this.showUserMessage(userMessage);
    }
  }

  // 便利メソッド
  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: LogCategory, message: string, data?: any, userMessage?: UserMessage): void {
    this.log(LogLevel.INFO, category, message, data, undefined, userMessage);
  }

  warn(category: LogCategory, message: string, data?: any, userMessage?: UserMessage): void {
    this.log(LogLevel.WARN, category, message, data, undefined, userMessage);
  }

  error(category: LogCategory, message: string, error?: Error, userMessage?: UserMessage): void {
    this.log(LogLevel.ERROR, category, message, undefined, error, userMessage);
  }

  fatal(category: LogCategory, message: string, error?: Error): void {
    const userMessage: UserMessage = {
      title: '致命的エラー',
      message: 'アプリケーションで重大な問題が発生しました。ページを再読み込みしてください。',
      type: 'error',
      duration: 0, // 自動で消えない
    };
    this.log(LogLevel.FATAL, category, message, undefined, error, userMessage);
  }

  // ユーザーメッセージ表示
  private showUserMessage(userMessage: UserMessage): void {
    const options = {
      duration: userMessage.duration ?? 4000,
      position: 'top-right' as const,
    };

    switch (userMessage.type) {
      case 'success':
        toast.success(`${userMessage.title}: ${userMessage.message}`, options);
        break;
      case 'error':
        toast.error(`${userMessage.title}: ${userMessage.message}`, options);
        break;
      case 'warning':
        toast.error(`${userMessage.title}: ${userMessage.message}`, options);
        break;
      case 'info':
        toast(`${userMessage.title}: ${userMessage.message}`, options);
        break;
    }
  }

  // パフォーマンス計測
  startPerformanceTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(LogCategory.PERFORMANCE, `${label} completed`, { duration });
      
      // 異常に遅い場合は警告
      if (duration > 1000) {
        this.warn(LogCategory.PERFORMANCE, `Slow operation detected: ${label}`, { duration });
      }
    };
  }

  // エラーバウンダリ用
  logReactError(error: Error, errorInfo: { componentStack: string }): void {
    this.error(
      LogCategory.UI,
      'React component error',
      error,
      {
        title: 'アプリケーションエラー',
        message: 'ページでエラーが発生しました。リロードをお試しください。',
        type: 'error',
      }
    );
  }

  // API エラー用
  logApiError(endpoint: string, status: number, error: any): void {
    const isNetworkError = !status || status === 0;
    const userMessage: UserMessage = {
      title: isNetworkError ? 'ネットワークエラー' : 'サーバーエラー',
      message: isNetworkError
        ? 'インターネット接続を確認してください'
        : `サーバーとの通信でエラーが発生しました (${status})`,
      type: 'error',
    };

    this.error(LogCategory.API, `API request failed: ${endpoint}`, error, userMessage);
  }

  // 認証エラー用
  logAuthError(action: string, error: any): void {
    this.error(
      LogCategory.AUTH,
      `Authentication failed: ${action}`,
      error,
      {
        title: '認証エラー',
        message: 'ログインが必要です。再度ログインしてください。',
        type: 'warning',
      }
    );
  }

  // 成功メッセージ用
  logSuccess(category: LogCategory, message: string, userTitle: string, userMessage: string): void {
    this.info(category, message, undefined, {
      title: userTitle,
      message: userMessage,
      type: 'success',
    });
  }

  // デバッグログの取得（開発用）
  getDebugLogs(): LogEntry[] {
    const logs = localStorage.getItem('fuyou_debug_logs');
    return logs ? JSON.parse(logs) : [];
  }

  // ログの消去
  clearLogs(): void {
    localStorage.removeItem('fuyou_debug_logs');
    this.info(LogCategory.UI, 'Debug logs cleared', undefined, {
      title: 'ログクリア',
      message: 'デバッグログを消去しました',
      type: 'info',
    });
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// React Hook用
export function useLogger() {
  return logger;
}

// 便利な型エクスポート
export type { LogEntry, UserMessage };