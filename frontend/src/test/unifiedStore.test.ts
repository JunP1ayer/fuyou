// 🧪 統合ストアテスト

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnifiedStore } from '../store/unifiedStore';

// テスト用のストア状態リセット
beforeEach(() => {
  useUnifiedStore.getState().reset();
});

describe('UnifiedStore', () => {
  const currentYear = new Date().getFullYear();
  const d1 = `${currentYear}-01-15`;
  const d2 = `${currentYear}-01-16`;
  describe('Shift Management', () => {
    it('should add a new shift', async () => {
      const store = useUnifiedStore.getState();
      
      const shiftData = {
        date: d1,
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      };

      await store.addShift(shiftData);
      
      const shifts = useUnifiedStore.getState().shifts;
      expect(shifts).toHaveLength(1);
      expect(shifts[0]).toMatchObject(shiftData);
      expect(shifts[0].id).toBeDefined();
      expect(shifts[0].createdAt).toBeDefined();
    });

    it('should update an existing shift', async () => {
      const store = useUnifiedStore.getState();
      
      // まずシフトを追加
      await store.addShift({
        date: d1,
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      const shiftId = useUnifiedStore.getState().shifts[0].id;
      
      // シフトを更新
      await store.updateShift(shiftId, {
        hourlyRate: 1200,
        totalEarnings: 8400,
      });

      const updatedShift = useUnifiedStore.getState().shifts[0];
      expect(updatedShift.hourlyRate).toBe(1200);
      expect(updatedShift.totalEarnings).toBe(8400);
      expect(updatedShift.updatedAt).not.toBe(updatedShift.createdAt);
    });

    it('should delete a shift', async () => {
      const store = useUnifiedStore.getState();
      
      // まずシフトを追加
      await store.addShift({
        date: d1,
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      const shiftId = useUnifiedStore.getState().shifts[0].id;
      
      // シフトを削除
      await store.deleteShift(shiftId);

      const shifts = useUnifiedStore.getState().shifts;
      expect(shifts).toHaveLength(0);
    });
  });

  describe('Workplace Management', () => {
    it('should add a new workplace', () => {
      const store = useUnifiedStore.getState();
      
      const workplaceData = {
        name: 'テストカフェ',
        color: '#ff6b6b',
        defaultHourlyRate: 1000,
        address: '東京都渋谷区',
        contactInfo: '03-1234-5678',
      };

      store.addWorkplace(workplaceData);
      
      const workplaces = useUnifiedStore.getState().workplaces;
      expect(workplaces).toHaveLength(1);
      expect(workplaces[0]).toMatchObject(workplaceData);
      expect(workplaces[0].id).toBeDefined();
    });

    it('should update a workplace', () => {
      const store = useUnifiedStore.getState();
      
      // まずワークプレースを追加
      store.addWorkplace({
        name: 'テストカフェ',
        color: '#ff6b6b',
        defaultHourlyRate: 1000,
      });

      const workplaceId = useUnifiedStore.getState().workplaces[0].id;
      
      // ワークプレースを更新
      store.updateWorkplace(workplaceId, {
        name: '更新されたカフェ',
        defaultHourlyRate: 1200,
      });

      const updatedWorkplace = useUnifiedStore.getState().workplaces[0];
      expect(updatedWorkplace.name).toBe('更新されたカフェ');
      expect(updatedWorkplace.defaultHourlyRate).toBe(1200);
    });

    it('should delete a workplace and associated shifts', async () => {
      const store = useUnifiedStore.getState();
      
      // ワークプレースを追加
      store.addWorkplace({
        name: 'テストカフェ',
        color: '#ff6b6b',
        defaultHourlyRate: 1000,
      });

      const workplaceId = useUnifiedStore.getState().workplaces[0].id;
      
      // 関連するシフトを追加
      await store.addShift({
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: workplaceId,
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      // ワークプレースを削除
      store.deleteWorkplace(workplaceId);

      const state = useUnifiedStore.getState();
      expect(state.workplaces).toHaveLength(0);
      expect(state.shifts).toHaveLength(0); // 関連シフトも削除される
    });
  });

  describe('Analytics', () => {
    it('should update analytics when shifts change', async () => {
      const store = useUnifiedStore.getState();
      
      // 複数のシフトを追加
      await store.addShift({
        date: d1,
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      await store.addShift({
        date: d2,
        startTime: '10:00',
        endTime: '18:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      const analytics = useUnifiedStore.getState().analytics;
      expect(analytics.totalShifts).toBe(2);
      expect(analytics.yearlyEarnings).toBe(14000);
      expect(analytics.riskLevel).toBe('safe');
    });

    it('should calculate correct risk levels', async () => {
      const store = useUnifiedStore.getState();
      
      // 高収入のシフトを追加（リスクレベルテスト）
      await store.addShift({
        date: d1,
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 3000,
        actualWorkMinutes: 420,
        totalEarnings: 1200000, // 120万円
      });

      const analytics = useUnifiedStore.getState().analytics;
      expect(analytics.riskLevel).toBe('danger');
    });
  });

  describe('UI State', () => {
    it('should manage active tab', () => {
      const store = useUnifiedStore.getState();
      
      expect(store.ui.activeTab).toBe('calendar');
      
      store.setActiveTab('submit');
      expect(useUnifiedStore.getState().ui.activeTab).toBe('submit');
    });

    it('should manage calendar view', () => {
      const store = useUnifiedStore.getState();
      
      expect(store.ui.calendarView).toBe('month');
      
      store.setCalendarView('week');
      expect(useUnifiedStore.getState().ui.calendarView).toBe('week');
    });

    it('should toggle compact mode', () => {
      const store = useUnifiedStore.getState();
      
      expect(store.ui.compactMode).toBe(false);
      
      store.toggleCompactMode();
      expect(useUnifiedStore.getState().ui.compactMode).toBe(true);
      
      store.toggleCompactMode();
      expect(useUnifiedStore.getState().ui.compactMode).toBe(false);
    });
  });

  describe('Data Import/Export', () => {
    it('should export data correctly', async () => {
      const store = useUnifiedStore.getState();
      
      // テストデータを追加
      await store.addShift({
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        workplaceName: 'テストカフェ',
        workplaceId: 'workplace-1',
        breakMinutes: 60,
        hourlyRate: 1000,
        actualWorkMinutes: 420,
        totalEarnings: 7000,
      });

      const exportedData = store.exportData();
      const parsedData = JSON.parse(exportedData);
      
      expect(parsedData.shifts).toHaveLength(1);
      expect(parsedData.exportedAt).toBeDefined();
    });

    it('should import data correctly', () => {
      const store = useUnifiedStore.getState();
      
      const importData = JSON.stringify({
        shifts: [{
          id: 'test-id',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '17:00',
          workplaceName: 'インポートカフェ',
          workplaceId: 'workplace-1',
          breakMinutes: 60,
          hourlyRate: 1000,
          actualWorkMinutes: 420,
          totalEarnings: 7000,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }],
        workplaces: [],
        friends: [],
      });

      const success = store.importData(importData);
      
      expect(success).toBe(true);
      const state = useUnifiedStore.getState();
      expect(state.shifts).toHaveLength(1);
      expect(state.shifts[0].workplaceName).toBe('インポートカフェ');
    });

    it('should handle invalid import data', () => {
      const store = useUnifiedStore.getState();
      
      const success = store.importData('invalid json');
      expect(success).toBe(false);
    });
  });

  describe('Friends Management', () => {
    it('should generate share code', () => {
      const store = useUnifiedStore.getState();
      
      const shareCode = store.generateShareCode();
      
      expect(shareCode).toBeDefined();
      expect(shareCode.length).toBe(12);
      expect(useUnifiedStore.getState().myShareCode).toBe(shareCode);
    });

    it('should add friend successfully', async () => {
      // fetchをモック
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const store = useUnifiedStore.getState();
      
      const success = await store.addFriend('test-share-code', '友達の名前');
      
      expect(success).toBe(true);
      const friends = useUnifiedStore.getState().friends;
      expect(friends).toHaveLength(1);
      expect(friends[0].name).toBe('友達の名前');
    });

    it('should toggle friend visibility', async () => {
      const store = useUnifiedStore.getState();
      
      // 友達を追加
      await store.addFriend('test-code', 'テストフレンド');
      const friendId = useUnifiedStore.getState().friends[0].id;
      
      expect(useUnifiedStore.getState().friends[0].isVisible).toBe(true);
      
      store.toggleFriendVisibility(friendId);
      expect(useUnifiedStore.getState().friends[0].isVisible).toBe(false);
    });
  });
});