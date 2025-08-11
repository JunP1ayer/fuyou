// 📱 PWA機能フック

import { useState, useEffect, useCallback, useRef } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasNotificationPermission: boolean;
  hasCameraAccess: boolean;
  hasLocationAccess: boolean;
  supportsBackgroundSync: boolean;
  supportsPushNotifications: boolean;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export const usePWA = () => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasNotificationPermission: false,
    hasCameraAccess: false,
    hasLocationAccess: false,
    supportsBackgroundSync: false,
    supportsPushNotifications: false,
  });

  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);

  // Service Worker 登録 (一時的に無効化)
  useEffect(() => {
    // Service Workerを無効化してテスト
    console.log('🔧 Service Worker registration disabled for debugging');
    return;
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-advanced.js')
        .then((registration) => {
          serviceWorkerRef.current = registration;
          console.log('Service Worker registered:', registration);

          // 更新チェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // メッセージリスナー
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
              case 'sync-success':
                console.log('Background sync successful:', data);
                // トーストなどで通知
                break;
              case 'sync-error':
                console.error('Background sync failed:', data);
                // エラー通知
                break;
              default:
                console.log('SW Message:', type, data);
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // インストールプロンプト検出
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as any);
      setCapabilities(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setCapabilities(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // オンライン/オフライン状態監視
  useEffect(() => {
    const handleOnline = () => {
      setCapabilities(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setCapabilities(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 機能チェック
  useEffect(() => {
    const checkCapabilities = async () => {
      const updates: Partial<PWACapabilities> = {};

      // PWAインストール状態チェック
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone) {
        updates.isInstalled = true;
      }

      // 通知権限チェック
      if ('Notification' in window) {
        updates.hasNotificationPermission = Notification.permission === 'granted';
      }

      // カメラアクセスチェック
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          updates.hasCameraAccess = devices.some(device => device.kind === 'videoinput');
        } catch (error) {
          updates.hasCameraAccess = false;
        }
      }

      // 位置情報アクセスチェック
      if ('geolocation' in navigator) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1000 });
          });
          updates.hasLocationAccess = true;
        } catch (error) {
          updates.hasLocationAccess = false;
        }
      }

      // バックグラウンド同期サポートチェック
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        updates.supportsBackgroundSync = true;
      }

      // プッシュ通知サポートチェック
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        updates.supportsPushNotifications = true;
      }

      setCapabilities(prev => ({ ...prev, ...updates }));
    };

    checkCapabilities();
  }, []);

  // アプリインストール
  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('App installation accepted');
        return true;
      } else {
        console.log('App installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('App installation failed:', error);
      return false;
    } finally {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  // 通知権限要求
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    setCapabilities(prev => ({ ...prev, hasNotificationPermission: granted }));
    return granted;
  }, []);

  // 通知送信
  const sendNotification = useCallback(async (options: NotificationOptions) => {
    if (!capabilities.hasNotificationPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    try {
      if (serviceWorkerRef.current) {
        // Service Worker経由で通知
        await serviceWorkerRef.current.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
        });
      } else {
        // 直接通知
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
        });
      }
      return true;
    } catch (error) {
      console.error('Notification failed:', error);
      return false;
    }
  }, [capabilities.hasNotificationPermission, requestNotificationPermission]);

  // プッシュ通知登録
  const subscribeToPushNotifications = useCallback(async () => {
    if (!serviceWorkerRef.current || !capabilities.supportsPushNotifications) {
      return null;
    }

    try {
      const subscription = await serviceWorkerRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      });

      // サーバーに登録情報を送信
      await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [capabilities.supportsPushNotifications]);

  // バックグラウンド同期
  const syncInBackground = useCallback(async (data: any) => {
    if (!serviceWorkerRef.current || !capabilities.supportsBackgroundSync) {
      console.warn('Background sync not supported');
      return false;
    }

    try {
      // Service Workerに同期データを送信
      serviceWorkerRef.current.active?.postMessage({
        type: 'add-to-sync-queue',
        data,
      });

      if ('sync' in serviceWorkerRef.current) {
        await (serviceWorkerRef.current as any).sync.register('sync-data');
      }
      console.log('Background sync registered');
      return true;
    } catch (error) {
      console.error('Background sync failed:', error);
      return false;
    }
  }, [capabilities.supportsBackgroundSync]);

  // アプリ更新
  const updateApp = useCallback(async () => {
    if (!serviceWorkerRef.current) return false;

    try {
      // 新しいService Workerをアクティブ化
      serviceWorkerRef.current.waiting?.postMessage({ type: 'skip-waiting' });
      
      // ページリロード
      window.location.reload();
      return true;
    } catch (error) {
      console.error('App update failed:', error);
      return false;
    }
  }, []);

  // オフラインデータ同期
  const syncOfflineData = useCallback(async () => {
    if (!serviceWorkerRef.current) return false;

    serviceWorkerRef.current.active?.postMessage({ type: 'sync-now' });
    return true;
  }, []);

  // 機能検出
  const hasFeature = useCallback((feature: keyof PWACapabilities) => {
    return capabilities[feature];
  }, [capabilities]);

  return {
    capabilities,
    installPrompt: installPrompt !== null,
    updateAvailable,
    installApp,
    requestNotificationPermission,
    sendNotification,
    subscribeToPushNotifications,
    syncInBackground,
    updateApp,
    syncOfflineData,
    hasFeature,
  };
};