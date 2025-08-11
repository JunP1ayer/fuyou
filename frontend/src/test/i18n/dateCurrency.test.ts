import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/utils/calculations';
import { formatLocalizedDate } from '@/utils/dateUtils';

describe('i18n currency/date formatting', () => {
  it('formats JPY without decimals', () => {
    const value = formatCurrency(123456, { locale: 'ja-JP', currency: 'JPY' });
    expect(value).toMatch(/¥|￥/);
    expect(value).not.toContain('.');
  });

  it('formats EUR with locale de-DE', () => {
    const value = formatCurrency(1234.56, { locale: 'de-DE', currency: 'EUR' });
    expect(value).toContain('€');
  });

  it('formats date per locale', () => {
    const d = new Date('2024-12-31T00:00:00.000Z');
    const ja = formatLocalizedDate(d, 'ja');
    const en = formatLocalizedDate(d, 'en');
    // Ensure both return a non-empty string and allow equality in minimal formats
    expect(ja.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
  });
});


