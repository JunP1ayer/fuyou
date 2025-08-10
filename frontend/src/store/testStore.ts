// テスト用のシンプルなストア
import { create } from 'zustand';

interface TestState {
  shiftsCount: number;
  totalEarnings: number;
  incrementShifts: () => void;
  addEarnings: (amount: number) => void;
}

export const useTestStore = create<TestState>(set => ({
  shiftsCount: 42,
  totalEarnings: 123456,
  incrementShifts: () => set(state => ({ shiftsCount: state.shiftsCount + 1 })),
  addEarnings: amount =>
    set(state => ({ totalEarnings: state.totalEarnings + amount })),
}));
