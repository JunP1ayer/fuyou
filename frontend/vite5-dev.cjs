#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Vite 5 with optimal WSL settings...');

// Start vite with specific options for WSL
const vite = spawn(
  'npx',
  ['vite@5.4.11', '--host', '0.0.0.0', '--port', '3000', '--force'],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, VITE_HOST: '0.0.0.0' },
  }
);

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
