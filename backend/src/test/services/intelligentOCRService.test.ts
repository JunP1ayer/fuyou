/* eslint-disable */
import { describe, it, expect } from '@jest/globals';
import { intelligentOCRService } from '../../services/intelligentOCRService';

describe('IntelligentOCRService fallback parsing', () => {
  it('returns empty shifts when text has no JSON', async () => {
    // @ts-expect-error access private to simulate provider parse
    const result = intelligentOCRService.parseAIResponse('no json here', 'openai');
    expect(result.shifts).toEqual([]);
    expect(result.naturalLanguageMessage).toContain('解析に失敗');
  });
});


