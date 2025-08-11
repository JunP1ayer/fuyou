import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  define: {
    // ブラウザ環境でのprocess.env対応
    'process.env': {},
    global: 'globalThis',
  },
  plugins: [
    react({
      // React Fast Refresh 最適化
      fastRefresh: true,
      // JSX最適化
      jsxImportSource: '@emotion/react',
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'framer-motion',
      'date-fns',
      'zustand',
      'react-hot-toast',
    ],
  },
  build: {
    // 本番ビルド最適化
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // チャンク分割戦略
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          // Material-UI (大きなライブラリ)
          'mui-core': [
            '@mui/material',
            '@mui/system', 
            '@emotion/react',
            '@emotion/styled'
          ],
          'mui-icons': ['@mui/icons-material'],
          // Framer Motion (アニメーション)
          'animation': ['framer-motion'],
          // 状態管理
          'state': ['zustand'],
          // ユーティリティ
          'utils': ['date-fns', 'react-hot-toast'],
          // 国際化
          'i18n': [
            './src/locales/ja.json',
            './src/locales/en.json', 
            './src/locales/de.json',
            './src/locales/da.json',
            './src/locales/fi.json',
            './src/locales/no.json'
          ]
        },
        // ファイル名最適化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // チャンクサイズ警告の閾値
    chunkSizeWarningLimit: 1000,
    // 圧縮設定
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
  // PWA用プリロード
  experimental: {
    renderBuiltUrl(filename: string, { hostType, type }: { hostType: 'js' | 'css' | 'html'; type: 'asset' | 'public' }) {
      if (type === 'public') {
        return '/' + filename;
      }
      return { relative: true };
    },
  },
});
