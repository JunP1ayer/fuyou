// 本番環境最初のログ - アプリ起動確認
console.log('⭐ main.tsx - Application starting:', {
  timestamp: new Date().toISOString(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
  href: typeof window !== 'undefined' ? window.location.href : 'SSR'
});

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

// 扶養カレンダー - エントリーポイント

// Global styles
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
