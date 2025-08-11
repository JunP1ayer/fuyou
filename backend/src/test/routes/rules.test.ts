/* eslint-disable */
import request from 'supertest';
import app from '../../app';

describe('Rules API', () => {
  it('returns rules with ETag and supports 304', async () => {
    const res1 = await request(app).get('/api/rules').expect(200);
    const etag = res1.headers['etag'];
    expect(etag).toBeDefined();
    expect(res1.headers['cache-control']).toContain('max-age');

    const res2 = await request(app)
      .get('/api/rules')
      .set('If-None-Match', etag as string)
      .expect(304);
    expect(res2.text).toBe('');
  });
});


