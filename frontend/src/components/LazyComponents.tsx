// ⚡ 遅延読み込みコンポーネント - パフォーマンス最適化

import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

// 遅延読み込みコンポーネントのラッパー
function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  displayName: string
): ComponentType<T extends ComponentType<infer P> ? P : never> {
  const LazyComponent = lazy(importFunc);
  // 型互換のためdisplayName代入は回避
  
  return (props: T extends ComponentType<infer P> ? P : never) => (
    <ErrorBoundary>
      <Suspense 
        fallback={
          <LoadingSpinner 
            variant="card" 
            message={`${displayName}を読み込んでいます...`}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// === Core Components (遅延読み込み) ===
export const LazyEarningsAnalytics = createLazyComponent(
  () => import('./analytics/EarningsAnalytics').then(m => ({ default: m.EarningsAnalytics })),
  'EarningsAnalytics'
);

export const LazyCountrySpecificHelp = createLazyComponent(
  () => import('./help/CountrySpecificHelp').then(m => ({ default: m.CountrySpecificHelp })),
  'CountrySpecificHelp'
);

export const LazyFriendSharingHub = createLazyComponent(
  () => import('./FriendSharingHub').then(m => ({ default: m.FriendSharingHub })),
  'FriendSharingHub'
);

export const LazyJobManagementHub = createLazyComponent(
  () => import('./JobManagementHub').then(m => ({ default: m.JobManagementHub })),
  'JobManagementHub'
);

export const LazyGPTShiftSubmitter = createLazyComponent(
  () => import('./GPTShiftSubmitter').then(m => ({ default: m.GPTShiftSubmitter })),
  'GPTShiftSubmitter'
);

export const LazyGPTShiftReviewer = createLazyComponent(
  () => import('./GPTShiftReviewer').then(m => ({ default: m.GPTShiftReviewer })),
  'GPTShiftReviewer'
);

// === Settings Components ===
export const LazySettingsView = createLazyComponent(
  () => import('./settings/SettingsView').then(m => ({ default: m.SettingsView })),
  'SettingsView'
);

// === Calendar Components ===
export const LazyCalendarView = createLazyComponent(
  () => import('./calendar/CalendarView').then(m => ({ default: m.CalendarView })),
  'CalendarView'
);

export const LazyInfiniteCalendar = createLazyComponent(
  () => import('./calendar/InfiniteCalendar').then(m => ({ default: m.InfiniteCalendar })),
  'InfiniteCalendar'
);

// === Form Components ===
export const LazyShiftForm = createLazyComponent(
  () => import('./forms/ShiftForm').then(m => ({ default: m.ShiftForm })),
  'ShiftForm'
);

export const LazySimpleShiftForm = createLazyComponent(
  () => import('./SimpleShiftForm').then(m => ({ default: m.SimpleShiftForm })),
  'SimpleShiftForm'
);

// === Dashboard Components ===
export const LazyEarningsDashboard = createLazyComponent(
  () => import('./dashboard/EarningsDashboard').then(m => ({ default: m.EarningsDashboard })),
  'EarningsDashboard'
);

// === Advanced Features (重要度低) ===
export const LazyWorkplaceManager = createLazyComponent(
  () => import('./WorkplaceManager').then(m => ({ default: m.WorkplaceManager })),
  'WorkplaceManager'
);

// === Route-based Lazy Components ===
export const LazyLegalPage = createLazyComponent(
  () => import('../pages/Legal').then(m => ({ default: m.default } as any)),
  'Legal'
);

// プリロード用のヘルパー関数
export const preloadComponent = (componentName: keyof typeof componentPreloaders) => {
  const preloader = componentPreloaders[componentName];
  if (preloader) {
    preloader();
  }
};

// プリロード関数マップ
const componentPreloaders = {
  EarningsAnalytics: () => import('./analytics/EarningsAnalytics'),
  CountrySpecificHelp: () => import('./help/CountrySpecificHelp'),
  FriendSharingHub: () => import('./FriendSharingHub'),
  JobManagementHub: () => import('./JobManagementHub'),
  GPTShiftSubmitter: () => import('./GPTShiftSubmitter'),
  GPTShiftReviewer: () => import('./GPTShiftReviewer'),
  SettingsView: () => import('./settings/SettingsView'),
  CalendarView: () => import('./calendar/CalendarView'),
  InfiniteCalendar: () => import('./calendar/InfiniteCalendar'),
  ShiftForm: () => import('./forms/ShiftForm'),
  SimpleShiftForm: () => import('./SimpleShiftForm'),
  EarningsDashboard: () => import('./dashboard/EarningsDashboard'),
  WorkplaceManager: () => import('./WorkplaceManager'),
  Legal: () => import('../pages/Legal'),
};

// インテリジェントプリロード
export const intelligentPreload = () => {
  // ユーザーの使用パターンに基づいてプリロード
  const activeTab = localStorage.getItem('activeTab');
  
  // 現在のタブに関連するコンポーネントを優先プリロード
  if (activeTab === 'salary') {
    preloadComponent('EarningsAnalytics');
    preloadComponent('EarningsDashboard');
  } else if (activeTab === 'submit') {
    preloadComponent('JobManagementHub');
    preloadComponent('GPTShiftSubmitter');
  } else if (activeTab === 'friends') {
    preloadComponent('FriendSharingHub');
  } else if (activeTab === 'settings') {
    preloadComponent('SettingsView');
    preloadComponent('CountrySpecificHelp');
  }
  
  // 高頻度使用コンポーネントを低優先度でプリロード
  setTimeout(() => {
    preloadComponent('CalendarView');
    preloadComponent('ShiftForm');
  }, 2000);
  
  // 低頻度使用コンポーネントをアイドル時にプリロード
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent('WorkplaceManager');
      preloadComponent('Legal');
    });
  }
};