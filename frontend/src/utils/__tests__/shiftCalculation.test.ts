import { describe, it, expect } from 'vitest';
import { 
  calculateShiftEarnings,
  calculateSimpleEarnings
} from '../shiftCalculation';
import { JobTemplate } from '../../components/JobManagement';

describe('shiftCalculation', () => {
  const mockJob: JobTemplate = {
    id: 'test-job',
    name: 'Test Job',
    hourlyRate: 1000,
    transportationCost: 500,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    defaultBreakMinutes: 60,
    color: '#3f51b5',
    isActive: true,
    nightHourlyRate: 1250
  };

  describe('calculateSimpleEarnings', () => {
    it('should calculate basic earnings', () => {
      const result = calculateSimpleEarnings(mockJob, '09:00', '17:00', 60);
      expect(result.workingHours).toBe(7); // 8 hours minus 1 hour break
      expect(result.earnings).toBe(7500); // 7 * 1000 + 500 transportation
    });

    it('should handle no break time', () => {
      const result = calculateSimpleEarnings(mockJob, '09:00', '17:00', 0);
      expect(result.workingHours).toBe(8);
      expect(result.earnings).toBe(8500); // 8 * 1000 + 500 transportation
    });
  });

  describe('calculateShiftEarnings', () => {
    it('should calculate detailed earnings for day shift', () => {
      const result = calculateShiftEarnings(mockJob, '2024-01-15', '09:00', '17:00', 60);
      expect(result.workingHours).toBe(7);
      expect(result.totalEarnings).toBeGreaterThan(7000);
    });

    it('should handle night shift premium', () => {
      const result = calculateShiftEarnings(mockJob, '2024-01-15', '22:00', '06:00', 0);
      expect(result.nightHours).toBeGreaterThan(0);
      expect(result.nightEarnings).toBeGreaterThan(0);
    });
  });

});