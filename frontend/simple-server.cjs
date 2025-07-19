#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting simple Vite server...');

// Start vite with proper host binding
const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
});

vite.on('close', code => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});
