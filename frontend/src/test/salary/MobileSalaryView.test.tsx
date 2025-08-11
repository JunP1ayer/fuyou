import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileSalaryView } from '@/components/salary/MobileSalaryView';
import { useSimpleShiftStore } from '@/store/simpleShiftStore';

describe('MobileSalaryView calculations', () => {
  beforeEach(() => {
    // 時刻を固定（2025-06-15）: 改正前ロジックの安定評価用
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));

    // LocalStorage初期化
    localStorage.clear();
    localStorage.setItem('hasVisitedSalaryView', 'true');

    // 扶養設定（学生・最大収入志向 → 150万円（改正前））
    localStorage.setItem('dependencyStatus', JSON.stringify({
      isStudent: true,
      age: 'over23',
      studentException: 'none',
      priority: 'maxIncome',
      autoRecommend: true,
    }));

    // シフト初期化
    const store = useSimpleShiftStore.getState();
    useSimpleShiftStore.setState({
      shifts: [],
      workplaces: [],
    });

    // 今月分: 10万円
    useSimpleShiftStore.setState((s) => ({
      shifts: [
        ...s.shifts,
        {
          id: 's1',
          date: '2025-06-10',
          startTime: '09:00',
          endTime: '13:00',
          breakMinutes: 0,
          actualWorkMinutes: 240,
          hourlyRate: 2500,
          totalEarnings: 100000,
          workplaceName: 'Cafe A',
          workplaceId: 'wp1',
        },
      ],
    }));

    // 別月（同年）: 20万円 → 年間合計 30万円
    useSimpleShiftStore.setState((s) => ({
      shifts: [
        ...s.shifts,
        {
          id: 's2',
          date: '2025-05-20',
          startTime: '10:00',
          endTime: '18:00',
          breakMinutes: 0,
          actualWorkMinutes: 480,
          hourlyRate: 2500,
          totalEarnings: 200000,
          workplaceName: 'Cafe A',
          workplaceId: 'wp1',
        },
      ],
    }));
  });

  it('shows correct monthly and yearly totals', async () => {
    render(<MobileSalaryView />);

    // ダイアログが開いていれば閉じる（最大2回試行）
    for (let i = 0; i < 2; i += 1) {
      const dialogs = screen.queryAllByRole('dialog');
      if (dialogs.length === 0) break;
      const later = screen.queryByRole('button', { name: 'あとで' });
      if (later) await userEvent.click(later);
    }

    // 今月の収入 = 100,000 円
    expect(await screen.findByText('今月の収入', undefined, { timeout: 2000 })).toBeInTheDocument();
    // 金額の表示（通貨記号は環境差があるため数値部分で判定）
    expect(
      screen.getAllByText((content) => /100,?000/.test(content)).length
    ).toBeGreaterThan(0);

    // 年タブに切り替え
    const yearTab = await screen.findByRole('tab', { name: '年' }, { timeout: 3000 });
    await userEvent.click(yearTab);

    // 年間収入 = 300,000 円
    expect(await screen.findByText('年間収入', undefined, { timeout: 2000 })).toBeInTheDocument();
    expect(
      screen.getAllByText((content) => /300,?000/.test(content)).length
    ).toBeGreaterThan(0);
  }, 15000);
});


