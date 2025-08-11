#!/usr/bin/env node

/**
 * Claude Code Hooks - プロジェクト品質保証
 * フォーマット・型チェック・機密ファイル保護を実行
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PROTECTED_PATTERNS = [
  /\.env$/,
  /\.env\./,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /token/i,
  /private[_-]?key/i,
];

const PROTECTED_CONTENT_PATTERNS = [
  /sk-[a-zA-Z0-9]{48,}/,  // OpenAI API keys
  /ghp_[a-zA-Z0-9]{36}/,  // GitHub Personal Access Tokens
  /gho_[a-zA-Z0-9]{36}/,  // GitHub OAuth tokens
  /AKIA[0-9A-Z]{16}/,     // AWS Access Key ID
];

function checkProtectedFiles() {
  console.log('🔒 Checking for protected files...');
  
  try {
    const files = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const protectedFiles = files.filter(file => 
      PROTECTED_PATTERNS.some(pattern => pattern.test(file))
    );
    
    if (protectedFiles.length > 0) {
      console.error('❌ Protected files detected:');
      protectedFiles.forEach(file => console.error(`   - ${file}`));
      throw new Error('Protected files cannot be committed');
    }
    
    // Content-based protection
    for (const file of files) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf8');
        const hasSecrets = PROTECTED_CONTENT_PATTERNS.some(pattern => 
          pattern.test(content)
        );
        
        if (hasSecrets) {
          console.error(`❌ Potential secrets detected in: ${file}`);
          throw new Error('Files containing secrets cannot be committed');
        }
      }
    }
    
    console.log('✅ No protected files found');
  } catch (error) {
    if (error.message.includes('not a git repository')) {
      console.log('⚠️  Not in a git repository, skipping protected files check');
      return;
    }
    throw error;
  }
}

function runFormatter() {
  console.log('🎨 Running Prettier...');
  
  try {
    if (existsSync('frontend/package.json')) {
      // Skip formatting if format script doesn't exist
      try {
        execSync('cd frontend && npm run format', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️  Format script not found, skipping...');
      }
    }
    console.log('✅ Formatting complete');
  } catch (error) {
    console.error('❌ Formatting failed');
    throw error;
  }
}

function runTypeCheck() {
  console.log('🔍 Running TypeScript check...');
  
  try {
    if (existsSync('frontend/package.json')) {
      execSync('cd frontend && npm run typecheck', { stdio: 'inherit' });
    }
    console.log('✅ Type check passed');
  } catch (error) {
    console.error('❌ Type check failed');
    throw error;
  }
}

function runLint() {
  console.log('🔍 Running ESLint...');
  
  try {
    if (existsSync('frontend/package.json')) {
      execSync('cd frontend && npm run lint', { stdio: 'inherit' });
    }
    console.log('✅ Linting passed');
  } catch (error) {
    console.error('❌ Linting failed');
    throw error;
  }
}

async function main() {
  console.log('🚀 Claude Code Hooks - Quality Check');
  console.log('=====================================');
  
  try {
    checkProtectedFiles();
    runFormatter();
    runTypeCheck();
    runLint();
    
    console.log('');
    console.log('🎉 All checks passed!');
  } catch (error) {
    console.error('');
    console.error(`💥 Hook failed: ${error.message}`);
    process.exit(1);
  }
}

main();