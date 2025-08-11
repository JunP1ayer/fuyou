/* eslint-disable */
import { describe, it, expect } from '@jest/globals';
import { ShiftService } from '../../services/shiftService';

describe('ShiftService time calculations', () => {
  const svc = new ShiftService();

  it('calculates same-day shift correctly', () => {
    // 09:00-17:00 with 60m break = 7h
    // @ts-expect-error accessing private for unit test
    const hours = svc.calculateWorkingHours('09:00', '17:00', 60);
    expect(hours).toBe(7);
  });

  it('handles overnight shift', () => {
    // 22:00-06:00 with 0 break = 8h
    // @ts-expect-error accessing private for unit test
    const hours = svc.calculateWorkingHours('22:00', '06:00', 0);
    expect(hours).toBe(8);
  });
});


