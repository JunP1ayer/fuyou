// 🎭 E2Eテストセットアップ - Playwright設定

import { test as base, expect } from '@playwright/test';
import { useUnifiedStore } from '../../store/unifiedStore';

// カスタムページオブジェクト
export class FuyouAppPage {
  constructor(public page: any) {}

  // === Navigation ===
  async navigateTo(tab: 'calendar' | 'submit' | 'friends' | 'salary' | 'settings') {
    await this.page.click(`[data-testid="nav-${tab}"]`);
    await this.page.waitForSelector(`[data-testid="${tab}-page"]`);
  }

  async waitForLoadingToComplete() {
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'detached' });
  }

  // === Calendar Operations ===
  async addShift(shiftData: {
    date: string;
    startTime: string;
    endTime: string;
    workplace: string;
    hourlyRate: number;
  }) {
    await this.navigateTo('calendar');
    await this.page.click('[data-testid="add-shift-button"]');
    
    await this.page.fill('[data-testid="shift-date"]', shiftData.date);
    await this.page.fill('[data-testid="shift-start-time"]', shiftData.startTime);
    await this.page.fill('[data-testid="shift-end-time"]', shiftData.endTime);
    await this.page.selectOption('[data-testid="shift-workplace"]', shiftData.workplace);
    await this.page.fill('[data-testid="shift-hourly-rate"]', shiftData.hourlyRate.toString());
    
    await this.page.click('[data-testid="save-shift-button"]');
    await this.waitForLoadingToComplete();
  }

  async editShift(shiftId: string, updates: Partial<{
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }>) {
    await this.page.click(`[data-testid="shift-${shiftId}"]`);
    await this.page.click('[data-testid="edit-shift-button"]');
    
    if (updates.startTime) {
      await this.page.fill('[data-testid="shift-start-time"]', updates.startTime);
    }
    if (updates.endTime) {
      await this.page.fill('[data-testid="shift-end-time"]', updates.endTime);
    }
    if (updates.hourlyRate) {
      await this.page.fill('[data-testid="shift-hourly-rate"]', updates.hourlyRate.toString());
    }
    
    await this.page.click('[data-testid="save-shift-button"]');
    await this.waitForLoadingToComplete();
  }

  async deleteShift(shiftId: string) {
    await this.page.click(`[data-testid="shift-${shiftId}"]`);
    await this.page.click('[data-testid="delete-shift-button"]');
    await this.page.click('[data-testid="confirm-delete-button"]');
    await this.waitForLoadingToComplete();
  }

  // === Workplace Management ===
  async addWorkplace(workplaceData: {
    name: string;
    hourlyRate: number;
    color: string;
  }) {
    await this.navigateTo('submit');
    await this.page.click('[data-testid="workplace-manager-button"]');
    await this.page.click('[data-testid="add-workplace-button"]');
    
    await this.page.fill('[data-testid="workplace-name"]', workplaceData.name);
    await this.page.fill('[data-testid="workplace-hourly-rate"]', workplaceData.hourlyRate.toString());
    await this.page.click('[data-testid="workplace-color"]');
    await this.page.click(`[data-testid="color-${workplaceData.color}"]`);
    
    await this.page.click('[data-testid="save-workplace-button"]');
    await this.waitForLoadingToComplete();
  }

  // === Friend Sharing ===
  async addFriend(shareCode: string, friendName: string) {
    await this.navigateTo('friends');
    await this.page.click('[data-testid="add-friend-tab"]');
    await this.page.fill('[data-testid="friend-share-code"]', shareCode);
    await this.page.fill('[data-testid="friend-name"]', friendName);
    await this.page.click('[data-testid="add-friend-button"]');
    await this.waitForLoadingToComplete();
  }

  async generateShareCode() {
    await this.navigateTo('friends');
    await this.page.click('[data-testid="generate-share-code-button"]');
    await this.waitForLoadingToComplete();
    
    return await this.page.textContent('[data-testid="my-share-code"]');
  }

  // === Settings ===
  async changeLanguage(language: 'ja' | 'en' | 'de' | 'da' | 'fi' | 'no') {
    await this.navigateTo('settings');
    await this.page.selectOption('[data-testid="language-select"]', language);
    await this.waitForLoadingToComplete();
  }

  async changeCountry(country: string) {
    await this.navigateTo('settings');
    await this.page.selectOption('[data-testid="country-select"]', country);
    await this.waitForLoadingToComplete();
  }

  // === Analytics ===
  async viewAnalytics() {
    await this.navigateTo('salary');
    await this.waitForLoadingToComplete();
  }

  async getEarningsData() {
    await this.viewAnalytics();
    
    const yearlyEarnings = await this.page.textContent('[data-testid="yearly-earnings"]');
    const monthlyEarnings = await this.page.textContent('[data-testid="monthly-earnings"]');
    const totalShifts = await this.page.textContent('[data-testid="total-shifts"]');
    
    return {
      yearlyEarnings: this.parseEarnings(yearlyEarnings || '0'),
      monthlyEarnings: this.parseEarnings(monthlyEarnings || '0'),
      totalShifts: parseInt(totalShifts || '0'),
    };
  }

  private parseEarnings(text: string): number {
    return parseInt(text.replace(/[^0-9]/g, ''));
  }

  // === AI Features ===
  async uploadShiftImage(imagePath: string) {
    await this.navigateTo('submit');
    await this.page.click('[data-testid="ai-analysis-tab"]');
    
    await this.page.setInputFiles('[data-testid="image-upload"]', imagePath);
    await this.page.click('[data-testid="analyze-image-button"]');
    
    // AI処理待機
    await this.page.waitForSelector('[data-testid="ai-results"]', { timeout: 30000 });
  }

  // === Error Handling ===
  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message);
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message);
  }

  // === Accessibility ===
  async checkAccessibility() {
    // キーボードナビゲーションテスト
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // ARIA属性チェック
    const buttons = this.page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // ボタンにはアクセス可能な名前が必要
      expect(ariaLabel || textContent).toBeTruthy();
    }
  }

  // === Performance ===
  async measureLoadTime() {
    const startTime = Date.now();
    await this.page.goto('/');
    await this.waitForLoadingToComplete();
    const loadTime = Date.now() - startTime;
    
    // 3秒以内での読み込み
    expect(loadTime).toBeLessThan(3000);
    
    return loadTime;
  }
}

// カスタムテストフィクスチャ
export const test = base.extend<{ fuyouApp: FuyouAppPage }>({
  fuyouApp: async ({ page }, use) => {
    const fuyouApp = new FuyouAppPage(page);
    
    // テスト前のセットアップ
    await page.goto('/');
    await fuyouApp.waitForLoadingToComplete();
    
    await use(fuyouApp);
    
    // テスト後のクリーンアップ
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },
});

export { expect } from '@playwright/test';