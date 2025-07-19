#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('Starting Vite development server with workaround...');

// Start vite in a child process
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'], {
  stdio: 'pipe',
  cwd: process.cwd(),
});

let serverReady = false;
let healthCheckInterval;

vite.stdout.on('data', data => {
  const output = data.toString();
  console.log(output);

  if (output.includes('ready in') && !serverReady) {
    serverReady = true;
    console.log('Vite reported ready, starting health checks...');

    // Start health checks
    let attempts = 0;
    const maxAttempts = 30;

    healthCheckInterval = setInterval(() => {
      attempts++;

      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          method: 'GET',
          timeout: 1000,
        },
        res => {
          clearInterval(healthCheckInterval);
          console.log(`✓ Server is accessible! Status: ${res.statusCode}`);
          console.log(
            '✓ Frontend development server is running at http://localhost:3000'
          );
        }
      );

      req.on('error', err => {
        if (attempts >= maxAttempts) {
          clearInterval(healthCheckInterval);
          console.error('✗ Server health check failed after 30 attempts');
          console.error('✗ This appears to be a Vite 7 issue in WSL');
          console.error('✗ Recommended solution: downgrade to Vite 5');
          console.error('✗ Or use: node workaround-dev.js');
          process.exit(1);
        }
        console.log(
          `Health check ${attempts}/${maxAttempts} failed, retrying...`
        );
      });

      req.end();
    }, 1000);
  }
});

vite.stderr.on('data', data => {
  console.error(data.toString());
});

vite.on('close', code => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
});
