#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('📦 Downgrading Vite to v5.4.11 to fix WSL networking issues...');

try {
  console.log('🔄 Installing Vite v5.4.11...');
  execSync('npm install vite@5.4.11', { stdio: 'inherit' });

  console.log('✅ Vite successfully downgraded!');
  console.log('📝 You can now run: npm run dev');
  console.log('🌐 Server will be accessible at http://localhost:3000');
} catch (error) {
  console.error('❌ Failed to downgrade Vite:', error.message);
  process.exit(1);
}
