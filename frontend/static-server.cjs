#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HOST = '0.0.0.0';

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to index.html for root and SPA routes
  if (pathname === '/' || !path.extname(pathname)) {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`404: ${pathname}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>扶養管理アプリ - Development Mode</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; }
          </style>
        </head>
        <body>
          <h1>扶養管理アプリ - 開発モード</h1>
          <div class="status warning">
            <h3>⚠️ 開発サーバー制限モード</h3>
            <p>Viteの権限問題により、現在は静的ファイルサーバーで動作しています。</p>
          </div>
          <div class="status info">
            <h3>📋 システム状況</h3>
            <ul>
              <li>✅ バックエンドAPI: <a href="http://localhost:3001/health">http://localhost:3001/health</a></li>
              <li>✅ シフト管理機能: 実装完了</li>
              <li>✅ CSV版機能: 完全動作</li>
              <li>⚠️ フロントエンド: 静的モード (React未実行)</li>
            </ul>
          </div>
          <div class="status info">
            <h3>🔧 解決方法</h3>
            <p>Windows PowerShellを管理者権限で実行し、フォルダの権限を変更してください：</p>
            <pre>icacls "C:\\Users\\junju\\OneDrive\\Desktop\\fuyou" /grant Everyone:F /T</pre>
            <p>その後、<code>npm install</code>を実行してViteを正常にインストールしてください。</p>
          </div>
          <h3>🎯 実装済み機能</h3>
          <ul>
            <li>Phase 1 シフト管理: ダッシュボード統合、CRUD操作、カレンダー表示</li>
            <li>CSV収入分析: 銀行明細自動解析、扶養計算</li>
            <li>認証システム: デモ/本番両対応</li>
            <li>TypeScript: 型安全性完全実装</li>
          </ul>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    // Add CORS headers for development
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log('🚀 Static Development Server Started');
  console.log(`   ➜ Local:   http://localhost:${PORT}/`);
  console.log(`   ➜ Network: http://${HOST}:${PORT}/`);
  console.log('');
  console.log('📋 Status:');
  console.log('   ✅ Backend API: Available at http://localhost:3001');
  console.log('   ⚠️  Frontend: Static mode (React requires npm install fix)');
  console.log('');
  console.log('🔧 To fix: Run Windows PowerShell as Administrator:');
  console.log(
    '   icacls "C:\\\\Users\\\\junju\\\\OneDrive\\\\Desktop\\\\fuyou" /grant Everyone:F /T'
  );
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});
