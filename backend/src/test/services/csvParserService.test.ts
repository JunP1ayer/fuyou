/* eslint-disable */
import { describe, it, expect } from '@jest/globals';
import { CSVParserService } from '../../services/csvParserService';

describe('CSVParserService basic parsing', () => {
  const svc = new CSVParserService();

  it('returns failure for empty CSV', async () => {
    const buf = Buffer.from('');
    const res = await svc.parseCSV(buf);
    expect(res.success).toBe(false);
  });
});


