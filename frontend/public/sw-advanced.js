// 🔧 高度なService Worker

const CACHE_NAME = 'fuyou-v1.2.0';
const OFFLINE_URL = '/offline.html';

// キャッシュするリソース
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

// API キャッシュ戦略
const API_CACHE_STRATEGIES = {
  '/api/shifts': 'networkFirst',
  '/api/workplaces': 'cacheFirst',
  '/api/calculations': 'staleWhileRevalidate',
};

// バックグラウンド同期用のキュー
let syncQueue = [];

// インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // 重要なリソースを事前キャッシュ
      await cache.addAll(STATIC_CACHE_URLS);
      
      // 新しいService Workerを即座にアクティブ化
      await self.skipWaiting();
    })()
  );
});

// アクティベーション時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    (async () => {
      // 古いキャッシュを削除
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
      
      // 全てのクライアントを制御下に置く
      await self.clients.claim();
    })()
  );
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // HTTPSでないリクエストは無視
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

// フェッチハンドリング
async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // API リクエストの処理
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  }
  
  // 静的リソースの処理
  if (isStaticResource(pathname)) {
    return handleStaticResource(request);
  }
  
  // HTML ページの処理
  if (request.mode === 'navigate') {
    return handleNavigation(request);
  }
  
  // その他のリクエスト
  return fetch(request);
}

// API リクエストハンドリング
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const strategy = getApiCacheStrategy(pathname);
  
  switch (strategy) {
    case 'networkFirst':
      return networkFirst(request);
    case 'cacheFirst':
      return cacheFirst(request);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request);
    default:
      return networkOnly(request);
  }
}

// キャッシュ戦略: Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // オフライン時のフォールバック
    if (request.method === 'POST' || request.method === 'PUT') {
      // 書き込み操作は同期キューに追加
      await addToSyncQueue(request);
      return new Response(
        JSON.stringify({ success: true, queued: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    throw error;
  }
}

// キャッシュ戦略: Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// キャッシュ戦略: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // バックグラウンドで更新
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {
    // ネットワークエラーは無視
  });
  
  return cachedResponse || fetchPromise;
}

// ネットワークのみ
async function networkOnly(request) {
  return fetch(request);
}

// 静的リソースハンドリング
async function handleStaticResource(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  
  return response;
}

// ナビゲーションハンドリング
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // オフライン時はオフラインページを返す
    const offlineResponse = await caches.match(OFFLINE_URL);
    return offlineResponse || new Response('オフラインです', { status: 503 });
  }
}

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(processSyncQueue());
  }
});

// 同期キューの処理
async function processSyncQueue() {
  console.log('[SW] Processing sync queue, items:', syncQueue.length);
  
  const itemsToSync = [...syncQueue];
  syncQueue = []; // キューをクリア
  
  for (const item of itemsToSync) {
    try {
      await fetch(item.request, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      console.log('[SW] Synced successfully:', item.url);
      
      // 成功を通知
      await notifyClients({
        type: 'sync-success',
        url: item.url,
      });
    } catch (error) {
      console.error('[SW] Sync failed:', item.url, error);
      
      // 失敗した項目を再度キューに追加
      syncQueue.push(item);
      
      // エラーを通知
      await notifyClients({
        type: 'sync-error',
        url: item.url,
        error: error.message,
      });
    }
  }
}

// 同期キューに追加
async function addToSyncQueue(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };
  
  syncQueue.push(requestData);
  
  // バックグラウンド同期を登録
  try {
    await self.registration.sync.register('sync-data');
  } catch (error) {
    console.error('[SW] Background sync not supported:', error);
  }
}

// プッシュ通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: 'シフトの時間が近づいています',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'shift-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '確認する',
        icon: '/icon-action-view.png',
      },
      {
        action: 'dismiss',
        title: '後で確認',
        icon: '/icon-action-dismiss.png',
      },
    ],
    data: {
      url: '/calendar',
      timestamp: Date.now(),
    },
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      Object.assign(options, payload);
    } catch (error) {
      console.error('[SW] Invalid push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('扶養管理アプリ', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  const targetUrl = data?.url || '/';
  
  if (action === 'view' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 既存のウィンドウがあれば、そこに移動
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 新しいウィンドウを開く
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// メッセージハンドリング
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, _data } = event.data;
  
  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
    case 'claim-clients':
      clients.claim();
      break;
    case 'clear-cache':
      clearCache();
      break;
    case 'sync-now':
      processSyncQueue();
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// キャッシュクリア
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// クライアントに通知
async function notifyClients(message) {
  const clientList = await clients.matchAll({ includeUncontrolled: true });
  clientList.forEach(client => {
    client.postMessage(message);
  });
}

// ヘルパー関数
function getApiCacheStrategy(pathname) {
  for (const [pattern, strategy] of Object.entries(API_CACHE_STRATEGIES)) {
    if (pathname.startsWith(pattern)) {
      return strategy;
    }
  }
  return 'networkFirst';
}

function isStaticResource(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/.test(pathname);
}

// 定期的なクリーンアップ
setInterval(async () => {
  // 古いキャッシュエントリを削除
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  for (const request of keys) {
    const response = await cache.match(request);
    const date = response?.headers.get('date');
    
    if (date) {
      const ageInMs = Date.now() - new Date(date).getTime();
      const maxAgeInMs = 7 * 24 * 60 * 60 * 1000; // 7日間
      
      if (ageInMs > maxAgeInMs) {
        await cache.delete(request);
        console.log('[SW] Deleted old cache entry:', request.url);
      }
    }
  }
}, 60 * 60 * 1000); // 1時間ごと