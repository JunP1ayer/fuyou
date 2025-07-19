#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const express = require('express');
const path = require('path');

console.log('🚀 Starting WSL-compatible Vite development server...');

// Create Express proxy server
const app = express();
const proxyPort = 3000;
const vitePort = 3001;

// Start Vite on a different port
const vite = spawn(
  'npx',
  ['vite', '--host', '0.0.0.0', '--port', vitePort.toString()],
  {
    stdio: 'pipe',
    cwd: process.cwd(),
  }
);

let viteReady = false;
let proxyServer;

vite.stdout.on('data', data => {
  const output = data.toString();
  console.log(output);

  if (output.includes('ready in') && !viteReady) {
    viteReady = true;
    console.log('✓ Vite server ready, starting proxy...');

    // Wait a bit for Vite to fully initialize
    setTimeout(() => {
      startProxy();
    }, 2000);
  }
});

vite.stderr.on('data', data => {
  console.error('Vite error:', data.toString());
});

function startProxy() {
  // Proxy all requests to Vite
  app.use('/', (req, res) => {
    const options = {
      hostname: 'localhost',
      port: vitePort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Proxy error');
    });

    req.pipe(proxyReq);
  });

  proxyServer = app.listen(proxyPort, '0.0.0.0', () => {
    console.log(`✅ Proxy server listening on http://localhost:${proxyPort}`);
    console.log(`✅ Frontend accessible at http://localhost:${proxyPort}`);

    // Test connection
    setTimeout(() => {
      const testReq = http.request(
        {
          hostname: 'localhost',
          port: proxyPort,
          method: 'GET',
          timeout: 5000,
        },
        res => {
          console.log(
            `✅ Connection test successful! Status: ${res.statusCode}`
          );
        }
      );

      testReq.on('error', err => {
        console.error('❌ Connection test failed:', err.message);
      });

      testReq.end();
    }, 1000);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (proxyServer) {
    proxyServer.close();
  }
  vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
  if (proxyServer) {
    proxyServer.close();
  }
  vite.kill('SIGTERM');
});

vite.on('close', code => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});
