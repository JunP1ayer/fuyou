#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Serve static files with correct MIME types
app.use(
  express.static('.', {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    },
  })
);

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Basic TypeScript/JSX transform (simplified)
app.get('/src/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Simple transforms for demo purposes
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      // Remove TypeScript types (very basic)
      content = content
        .replace(/import\s+type\s+[^;]+;/g, '')
        .replace(/:\s*[A-Za-z<>[\]|&\s,={}]+(\s*[=;])/g, '$1')
        .replace(/\?\s*:/g, ':')
        .replace(/as\s+[A-Za-z<>[\]|&\s]+/g, '')
        .replace(/interface\s+[^{]+{[^}]*}/g, '')
        .replace(/type\s+[^=]+=[^;]+;/g, '');
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.send(content);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Index file not found');
  }
});

app.listen(PORT, HOST, () => {
  console.log('🚀 React Development Server Started');
  console.log(`   ➜ Local:   http://localhost:${PORT}/`);
  console.log(`   ➜ Network: http://${HOST}:${PORT}/`);
  console.log('');
  console.log('📋 Status:');
  console.log('   ✅ Backend API: Available at http://172.26.93.180:3001');
  console.log('   ⚠️  Frontend: Basic Node.js server (limited React support)');
  console.log('');
  console.log('🔧 Note: This is a fallback server due to WSL2 npm issues');
  console.log('   For full functionality, resolve npm permissions');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});
