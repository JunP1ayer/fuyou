// 👤 ユーザープロファイル・扶養チェック状態管理

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 扶養チェック結果の型定義
export interface FuyouCheckResult {
  // 基本情報
  userType: 'student' | 'worker';
  age: number;
  
  // 扶養制度設定
  selectedLimit: 103 | 130 | 150; // 万円
  
  // 現在の収入状況
  currentYearEarnings: number;
  previousMonthEarnings: number;
  
  // 計算結果
  remainingAmount: number; // 残り稼げる金額
  riskLevel: 'safe' | 'warning' | 'danger';
  monthlyRecommendedLimit: number; // 月あたり推奨上限
  
  // メタデータ
  checkedAt: string;
  isValid: boolean;
}

// ユーザープロファイル状態
interface UserProfileState {
  // 初回ログイン・扶養チェック状態
  isFirstLogin: boolean;
  hasCompletedFuyouCheck: boolean;
  hasViewedSalaryTab: boolean;
  
  // 扶養チェック結果
  fuyouCheckResult: FuyouCheckResult | null;
  
  // UI状態
  showFuyouCheckDialog: boolean;
  showSalaryTabFirstTime: boolean;
}

// アクション定義
interface UserProfileActions {
  // 初回ログイン完了
  completeFirstLogin: () => void;
  
  // 扶養チェック完了
  completeFuyouCheck: (result: FuyouCheckResult) => void;
  
  // 扶養チェック後で実行
  deferFuyouCheck: () => void;
  
  // 給料タブ初回閲覧
  markSalaryTabViewed: () => void;
  
  // ダイアログ表示制御
  showFuyouCheck: () => void;
  hideFuyouCheck: () => void;
  
  // リセット（デバッグ用）
  resetUserProfile: () => void;
  
  // 扶養チェック結果の更新
  updateFuyouResult: (result: FuyouCheckResult) => void;
}

type UserProfileStore = UserProfileState & UserProfileActions;

// 初期状態
const initialState: UserProfileState = {
  isFirstLogin: true,
  hasCompletedFuyouCheck: false,
  hasViewedSalaryTab: false,
  fuyouCheckResult: null,
  showFuyouCheckDialog: false,
  showSalaryTabFirstTime: false,
};

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      
      // 初回ログイン完了
      completeFirstLogin: () => {
        set((state) => {
          state.isFirstLogin = false;
        });
      },
      
      // 扶養チェック完了
      completeFuyouCheck: (result: FuyouCheckResult) => {
        set((state) => {
          state.hasCompletedFuyouCheck = true;
          state.fuyouCheckResult = result;
          state.showFuyouCheckDialog = false;
        });
      },
      
      // 後でボタン押下
      deferFuyouCheck: () => {
        set((state) => {
          state.isFirstLogin = false;
          state.showFuyouCheckDialog = false;
          // hasCompletedFuyouCheckはfalseのまま
        });
      },
      
      // 給料タブ初回閲覧
      markSalaryTabViewed: () => {
        set((state) => {
          state.hasViewedSalaryTab = true;
          state.showSalaryTabFirstTime = false;
        });
      },
      
      // 扶養チェックダイアログ表示
      showFuyouCheck: () => {
        set((state) => {
          state.showFuyouCheckDialog = true;
        });
      },
      
      // 扶養チェックダイアログ非表示
      hideFuyouCheck: () => {
        set((state) => {
          state.showFuyouCheckDialog = false;
        });
      },
      
      // 扶養チェック結果更新
      updateFuyouResult: (result: FuyouCheckResult) => {
        set((state) => {
          state.fuyouCheckResult = result;
        });
      },
      
      // リセット（デバッグ・開発用）
      resetUserProfile: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isFirstLogin: state.isFirstLogin,
        hasCompletedFuyouCheck: state.hasCompletedFuyouCheck,
        hasViewedSalaryTab: state.hasViewedSalaryTab,
        fuyouCheckResult: state.fuyouCheckResult,
      }),
    }
  )
);

// ヘルパー関数
export const getUserProfileStatus = () => {
  const {
    isFirstLogin,
    hasCompletedFuyouCheck,
    hasViewedSalaryTab,
    fuyouCheckResult
  } = useUserProfileStore.getState();
  
  return {
    // 初回ログイン時に扶養チェックを表示すべきか
    shouldShowFuyouCheckOnLogin: isFirstLogin,
    
    // 給料タブで扶養チェックを表示すべきか
    shouldShowFuyouCheckOnSalaryTab: !hasCompletedFuyouCheck && hasViewedSalaryTab,
    
    // 給料タブで結果を表示すべきか
    shouldShowResultsOnSalaryTab: hasCompletedFuyouCheck && !!fuyouCheckResult,
    
    // 状態サマリー
    status: {
      firstLogin: isFirstLogin,
      checkCompleted: hasCompletedFuyouCheck,
      salaryTabViewed: hasViewedSalaryTab,
      hasResults: !!fuyouCheckResult,
    }
  };
};