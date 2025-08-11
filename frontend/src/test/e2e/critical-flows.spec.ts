// 🎭 クリティカルフローE2Eテスト

import { test, expect } from './setup';

test.describe('Critical User Flows', () => {
  test.describe('Shift Management Flow', () => {
    test('should create, edit, and delete shifts successfully', async ({ fuyouApp, page }) => {
      // 1. ワークプレースの作成
      await fuyouApp.addWorkplace({
        name: 'テストカフェ',
        hourlyRate: 1000,
        color: 'blue'
      });

      // 2. シフトの作成
      await fuyouApp.addShift({
        date: '2024-02-15',
        startTime: '09:00',
        endTime: '17:00',
        workplace: 'テストカフェ',
        hourlyRate: 1000
      });

      // 3. シフトが正常に作成されたことを確認
      await expect(page.locator('[data-testid="shift-item"]')).toHaveCount(1);
      
      // 4. 分析データの更新確認
      const analyticsData = await fuyouApp.getEarningsData();
      expect(analyticsData.totalShifts).toBe(1);
      expect(analyticsData.yearlyEarnings).toBeGreaterThan(0);

      // 5. シフトの編集
      const shiftId = await page.getAttribute('[data-testid="shift-item"]', 'data-shift-id');
      await fuyouApp.editShift(shiftId!, {
        hourlyRate: 1200
      });

      // 6. 編集後の分析データ確認
      const updatedAnalytics = await fuyouApp.getEarningsData();
      expect(updatedAnalytics.yearlyEarnings).toBeGreaterThan(analyticsData.yearlyEarnings);

      // 7. シフトの削除
      await fuyouApp.deleteShift(shiftId!);
      await expect(page.locator('[data-testid="shift-item"]')).toHaveCount(0);
    });

    test('should handle shift creation errors gracefully', async ({ fuyouApp, page }) => {
      // 無効なデータでシフト作成を試行
      await fuyouApp.navigateTo('calendar');
      await page.click('[data-testid="add-shift-button"]');
      
      // 必須フィールドを空にしてフォーム送信
      await page.click('[data-testid="save-shift-button"]');
      
      // バリデーションエラーメッセージの確認
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });

  test.describe('Multi-language Support Flow', () => {
    test('should switch languages and maintain functionality', async ({ fuyouApp, page }) => {
      // 1. 日本語でシフト作成
      await fuyouApp.addWorkplace({
        name: 'カフェ',
        hourlyRate: 1000,
        color: 'green'
      });

      // 2. 英語に切り替え
      await fuyouApp.changeLanguage('en');
      
      // 3. UI言語が変更されたことを確認
      await expect(page.locator('[data-testid="nav-calendar"]')).toContainText('Calendar');
      
      // 4. データが保持されていることを確認
      await fuyouApp.navigateTo('submit');
      await expect(page.locator('[data-testid="workplace-item"]')).toContainText('カフェ');

      // 5. ドイツ語に切り替え
      await fuyouApp.changeLanguage('de');
      await expect(page.locator('[data-testid="nav-calendar"]')).toContainText('Kalender');

      // 6. 日本語に戻す
      await fuyouApp.changeLanguage('ja');
      await expect(page.locator('[data-testid="nav-calendar"]')).toContainText('カレンダー');
    });

    test('should format currency correctly for different countries', async ({ fuyouApp, page }) => {
      // シフトを作成
      await fuyouApp.addWorkplace({
        name: 'テスト職場',
        hourlyRate: 1000,
        color: 'red'
      });

      await fuyouApp.addShift({
        date: '2024-02-15',
        startTime: '09:00',
        endTime: '17:00',
        workplace: 'テスト職場',
        hourlyRate: 1000
      });

      // 日本（円）
      await fuyouApp.changeCountry('JP');
      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="yearly-earnings"]')).toContainText('¥');

      // ドイツ（ユーロ）
      await fuyouApp.changeCountry('DE');
      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="yearly-earnings"]')).toContainText('€');

      // イギリス（ポンド）
      await fuyouApp.changeCountry('UK');
      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="yearly-earnings"]')).toContainText('£');
    });
  });

  test.describe('Friend Sharing Flow', () => {
    test('should share and view friend schedules', async ({ fuyouApp, page, browser }) => {
      // 1. 共有コードを生成
      const shareCode = await fuyouApp.generateShareCode();
      expect(shareCode).toBeTruthy();

      // 2. 新しいブラウザコンテキストで友達のシミュレーション
      const friendContext = await browser.newContext();
      const friendPage = await friendContext.newPage();
      const friendApp = new (await import('./setup')).FuyouAppPage(friendPage);
      
      await friendPage.goto('/');
      await friendApp.waitForLoadingToComplete();

      // 3. 友達として共有コードを使用してアクセス
      await friendApp.addFriend(shareCode!, 'テスト友達');

      // 4. 友達が正常に追加されたことを確認
      await expect(friendPage.locator('[data-testid="friend-item"]')).toHaveCount(1);

      // 5. 友達のカレンダーが表示されることを確認
      await friendApp.navigateTo('friends');
      await friendPage.click('[data-testid="view-calendar-tab"]');
      
      await expect(friendPage.locator('[data-testid="friend-calendar"]')).toBeVisible();

      await friendContext.close();
    });

    test('should handle invalid share codes', async ({ fuyouApp, page }) => {
      await fuyouApp.navigateTo('friends');
      await fuyouApp.addFriend('INVALID_CODE', '無効な友達');
      
      await fuyouApp.expectErrorMessage('無効な共有コードです');
    });
  });

  test.describe('Analytics and Risk Assessment Flow', () => {
    test('should calculate risk levels correctly', async ({ fuyouApp, page }) => {
      // 1. ワークプレース作成
      await fuyouApp.addWorkplace({
        name: '高収入バイト',
        hourlyRate: 2000,
        color: 'orange'
      });

      // 2. 低リスクレベルの収入（安全範囲）
      await fuyouApp.addShift({
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '13:00', // 4時間
        workplace: '高収入バイト',
        hourlyRate: 2000
      });

      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="risk-level"]')).toContainText('safe');

      // 3. 中リスクレベルの収入を追加（警告範囲）
      for (let i = 0; i < 15; i++) {
        await fuyouApp.addShift({
          date: `2024-01-${16 + i}`,
          startTime: '09:00',
          endTime: '17:00', // 8時間
          workplace: '高収入バイト',
          hourlyRate: 2000
        });
      }

      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="risk-level"]')).toContainText('warning');

      // 4. リスクレベルの詳細情報が表示されることを確認
      await expect(page.locator('[data-testid="risk-details"]')).toBeVisible();
    });

    test('should show dependency limit progress correctly', async ({ fuyouApp, page }) => {
      // 日本の学生設定
      await fuyouApp.changeCountry('JP');
      
      // 収入データの作成
      await fuyouApp.addWorkplace({
        name: 'テストバイト',
        hourlyRate: 1000,
        color: 'purple'
      });

      await fuyouApp.addShift({
        date: '2024-02-01',
        startTime: '09:00',
        endTime: '17:00',
        workplace: 'テストバイト',
        hourlyRate: 1000
      });

      // 進捗バーの確認
      await fuyouApp.viewAnalytics();
      await expect(page.locator('[data-testid="dependency-progress"]')).toBeVisible();
      
      const progressText = await page.textContent('[data-testid="dependency-progress"]');
      expect(progressText).toMatch(/\d+%/); // パーセンテージ表示の確認
    });
  });

  test.describe('Accessibility Flow', () => {
    test('should be fully keyboard navigable', async ({ fuyouApp, page }) => {
      // キーボードナビゲーションテスト
      await fuyouApp.checkAccessibility();

      // Tabキーでのナビゲーション
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Enterキーでの操作
      await page.keyboard.press('Enter');
      
      // Escapeキーでのダイアログ閉じる
      await page.keyboard.press('Escape');
    });

    test('should work with screen readers', async ({ fuyouApp, page }) => {
      // ARIA属性の確認
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const textContent = await heading.textContent();
        expect(textContent).toBeTruthy();
      }

      // ランドマークの確認
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    });
  });

  test.describe('Performance Flow', () => {
    test('should load within performance budgets', async ({ fuyouApp, page }) => {
      const loadTime = await fuyouApp.measureLoadTime();
      expect(loadTime).toBeLessThan(3000); // 3秒以内

      // Core Web Vitals のシミュレーション
      const performanceEntries = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'));
      });
      
      const entries = JSON.parse(performanceEntries);
      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart).toBeLessThan(1500);
      }
    });

    test('should handle large amounts of data efficiently', async ({ fuyouApp, page }) => {
      // 大量のシフトデータを作成
      await fuyouApp.addWorkplace({
        name: 'パフォーマンステスト職場',
        hourlyRate: 1000,
        color: 'cyan'
      });

      const startTime = Date.now();

      // 100個のシフトを作成
      for (let i = 1; i <= 100; i++) {
        const date = `2024-${String(Math.floor((i - 1) / 30) + 1).padStart(2, '0')}-${String(((i - 1) % 30) + 1).padStart(2, '0')}`;
        await fuyouApp.addShift({
          date,
          startTime: '09:00',
          endTime: '17:00',
          workplace: 'パフォーマンステスト職場',
          hourlyRate: 1000
        });

        // 10件ごとにパフォーマンスチェック
        if (i % 10 === 0) {
          const currentTime = Date.now();
          const averageTime = (currentTime - startTime) / i;
          expect(averageTime).toBeLessThan(200); // 1件あたり200ms以内
        }
      }

      // 分析画面の表示速度チェック
      const analyticsStartTime = Date.now();
      await fuyouApp.viewAnalytics();
      const analyticsLoadTime = Date.now() - analyticsStartTime;
      
      expect(analyticsLoadTime).toBeLessThan(2000); // 2秒以内で分析表示
    });
  });
});