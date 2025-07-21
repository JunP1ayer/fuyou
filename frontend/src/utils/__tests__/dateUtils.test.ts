import { describe, it, expect } from 'vitest';
import { 
  format, 
  isToday, 
  isSameMonth,
  addMonths,
  subMonths
} from '../dateUtils';

describe('dateUtils', () => {
  describe('format', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(format(date, 'yyyy-MM-dd')).toBe('2024-01-15');
    });

    it('should handle different formats', () => {
      const date = new Date('2024-01-15');
      expect(format(date, 'M/d/yyyy')).toBe('1/15/2024');
    });
  });



  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    it('should return true for same month', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      expect(isSameMonth(date1, date2)).toBe(true);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');
      expect(isSameMonth(date1, date2)).toBe(false);
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      const date = new Date('2024-01-15');
      const result = addMonths(date, 2);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle year overflow', () => {
      const date = new Date('2024-11-15');
      const result = addMonths(date, 2);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('subMonths', () => {
    it('should subtract months correctly', () => {
      const date = new Date('2024-03-15');
      const result = subMonths(date, 2);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle year underflow', () => {
      const date = new Date('2024-01-15');
      const result = subMonths(date, 2);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getFullYear()).toBe(2023);
    });
  });
});