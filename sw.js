// Service Worker for 扶養プロ - Progressive Web App
const CACHE_NAME = 'fuyou-pro-v1.0.0';
const urlsToCache = [
  '/',
  '/ai-vision-service.js',
  '/fuyou-optimization-engine.js',
  '/manifest.json',
  '/config.js',
  '/secure-config-loader.js',
  '/setup-wizard.js',
  '/analytics-tracker.js',
  '/backup-manager.js',
  '/premium-features.js',
  '/gemini-vision-service.js'
];

// インストール時のキャッシュ処理
self.addEventListener('install', (event) => {
  console.log('Service Worker: インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: ファイルをキャッシュ中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: インストール完了');
        return self.skipWaiting(); // 即座にアクティブ化
      })
      .catch((error) => {
        console.error('Service Worker: インストールエラー', error);
      })
  );
});

// アクティベーション時の古いキャッシュ削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: アクティベーション中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: 古いキャッシュを削除', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: アクティベーション完了');
        return self.clients.claim(); // 即座に制御開始
      })
  );
});

// ネットワークリクエストのインターセプト
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにある場合はキャッシュから返す
        if (response) {
          return response;
        }

        // ネットワークリクエストを実行
        return fetch(event.request)
          .then((response) => {
            // 有効なレスポンスかチェック
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // ネットワークエラー時のフォールバック
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('Service Worker: バックグラウンド同期', event.tag);
  
  if (event.tag === 'background-sync-shifts') {
    event.waitUntil(syncShifts());
  }
});

// プッシュ通知
self.addEventListener('push', (event) => {
  console.log('Service Worker: プッシュ通知受信', event);
  
  const options = {
    body: event.data ? event.data.text() : '扶養プロからの通知です',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: '/action-explore.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('扶養プロ', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: 通知クリック', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // 何もしない（通知を閉じるだけ）
  } else {
    // デフォルトアクション
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 扶養限度額チェック用の定期実行
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'fuyou-check') {
    event.waitUntil(checkFuyouLimit());
  }
});

// ヘルパー関数: シフトデータ同期
async function syncShifts() {
  try {
    console.log('Service Worker: シフトデータを同期中...');
    
    // ローカルストレージからペンディング中のシフトを取得
    const pendingShifts = await getPendingShifts();
    
    if (pendingShifts.length > 0) {
      // サーバーに送信（実際のAPIエンドポイントに置き換え）
      const response = await fetch('/api/sync-shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shifts: pendingShifts })
      });

      if (response.ok) {
        // 成功時はペンディングデータを削除
        await clearPendingShifts();
        console.log('Service Worker: シフト同期完了');
      }
    }
  } catch (error) {
    console.error('Service Worker: シフト同期エラー', error);
  }
}

// ヘルパー関数: 扶養限度額チェック
async function checkFuyouLimit() {
  try {
    console.log('Service Worker: 扶養限度額をチェック中...');
    
    // ローカルストレージから現在の収入を取得
    const currentIncome = await getCurrentIncome();
    // 2025年税制対応：動的限度額取得
    const getUserSettings = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('fuyou_user_settings') || '{}');
            const studentStatus = settings.studentStatus || 'general';
            
            switch (studentStatus) {
                case 'student-19-22':
                    return 1500000; // 150万円
                case 'student-other':
                    return 1230000; // 123万円
                case 'general':
                default:
                    return 1230000; // 123万円
            }
        } catch {
            return 1230000; // デフォルト値
        }
    };
    
    const fuyouLimit = getUserSettings();
    const warningThreshold = fuyouLimit * 0.9; // 90%で警告
    
    if (currentIncome >= warningThreshold) {
      const remaining = fuyouLimit - currentIncome;
      const message = remaining > 0 
        ? `扶養限度額まであと¥${remaining.toLocaleString()}です。注意が必要です。`
        : '扶養限度額を超過しています！至急対応が必要です。';

      await self.registration.showNotification('扶養プロ - 重要な通知', {
        body: message,
        icon: '/icon-192.png',
        badge: '/badge-96.png',
        tag: 'fuyou-warning',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
          {
            action: 'view-details',
            title: '詳細を確認',
            icon: '/action-view.png'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Service Worker: 扶養限度額チェックエラー', error);
  }
}

// ヘルパー関数: ペンディングシフト取得
async function getPendingShifts() {
  // IndexedDBまたはローカルストレージから取得
  // 実装は簡略化
  return [];
}

// ヘルパー関数: ペンディングシフト削除
async function clearPendingShifts() {
  // IndexedDBまたはローカルストレージから削除
  // 実装は簡略化
  return true;
}

// ヘルパー関数: 現在の収入取得
async function getCurrentIncome() {
  try {
    // ローカルストレージから取得（実際の実装では IndexedDB を使用）
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // メインスレッドにメッセージを送信して収入データを取得
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data.yearlyIncome || 0);
        };
        clients[0].postMessage({ action: 'get-yearly-income' }, [channel.port2]);
      });
    }
    return 0;
  } catch (error) {
    console.error('Service Worker: 収入取得エラー', error);
    return 0;
  }
}

// メッセージリスナー
self.addEventListener('message', (event) => {
  console.log('Service Worker: メッセージ受信', event.data);
  
  if (event.data.action === 'skip-waiting') {
    self.skipWaiting();
  } else if (event.data.action === 'get-version') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});