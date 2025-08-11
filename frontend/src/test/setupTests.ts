// Polyfills for jsdom environment
// - crypto.randomUUID
// - btoa (used in share code generation)
if (!(global as any).crypto) {
  (global as any).crypto = {};
}
if (typeof (global as any).crypto.randomUUID !== 'function') {
  (global as any).crypto.randomUUID = () =>
    `test-${Math.random().toString(36).slice(2, 10)}`;
}
if (typeof (global as any).btoa !== 'function') {
  (global as any).btoa = (str: string) =>
    Buffer.from(str, 'binary').toString('base64');
}

// Mock fetch for tests to avoid real network calls
const originalFetch = global.fetch;
beforeAll(() => {
  // Minimal mock that returns OK JSON for our API paths
  (global as any).fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.toString?.();
    if (typeof url === 'string' && url.startsWith('/api/shifts')) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof originalFetch === 'function') {
      return originalFetch(input, init) as any;
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

afterAll(() => {
  global.fetch = originalFetch as any;
});
// 🧪 テストセットアップ - Vitest + Testing Library設定

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library自動クリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルモック設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver モック
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// ResizeObserver モック
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Web APIs モック
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// crypto.randomUUID モック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
});

// Framer Motion モック（テスト高速化）
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));