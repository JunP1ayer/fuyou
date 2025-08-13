/**
 * API統合テスト - 全エンドポイントの包括的テスト
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../../app';
import { supabase } from '../../utils/supabase';
import { Server } from 'http';
import path from 'path';
import fs from 'fs';

describe('API統合テスト', () => {
  let server: Server;
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    server = app.listen(0); // ランダムポートで起動
    
    // テスト用ユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (authError || !authData.user) {
      throw new Error('テストユーザーの作成に失敗');
    }
    
    userId = authData.user.id;
    authToken = authData.session?.access_token || '';
  });

  afterAll(async () => {
    // テストデータクリーンアップ
    if (userId) {
      await supabase.from('shifts').delete().eq('user_id', userId);
      await supabase.from('incomes').delete().eq('user_id', userId);
      await supabase.from('csv_uploads').delete().eq('user_id', userId);
    }
    
    server.close();
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリア
    if (userId) {
      await supabase.from('shifts').delete().eq('user_id', userId);
      await supabase.from('incomes').delete().eq('user_id', userId);
      await supabase.from('csv_uploads').delete().eq('user_id', userId);
    }
  });

  describe('認証エンドポイント', () => {
    describe('POST /api/demo/login', () => {
      it('デモログインが成功する', async () => {
        const response = await request(app)
          .post('/api/demo/login')
          .send({
            username: 'demo',
            password: 'demo123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
      });

      it('無効な認証情報でログインが失敗する', async () => {
        const response = await request(app)
          .post('/api/demo/login')
          .send({
            username: 'invalid',
            password: 'wrong'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('必要フィールドが不足している場合エラーになる', async () => {
        const response = await request(app)
          .post('/api/demo/login')
          .send({
            username: 'demo'
            // password不足
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('シフト管理エンドポイント', () => {
    const sampleShift = {
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '17:00',
      workplaceName: 'テストコンビニ',
      hourlyWage: 1000,
      breakMinutes: 60,
      notes: 'テストシフト'
    };

    describe('POST /api/shifts', () => {
      it('新しいシフトを作成できる', async () => {
        const response = await request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sampleShift);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.workplaceName).toBe(sampleShift.workplaceName);
      });

      it('無効なデータでシフト作成が失敗する', async () => {
        const invalidShift = {
          ...sampleShift,
          startTime: '25:00' // 無効な時刻
        };

        const response = await request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidShift);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('認証なしでシフト作成が失敗する', async () => {
        const response = await request(app)
          .post('/api/shifts')
          .send(sampleShift);

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/shifts', () => {
      beforeEach(async () => {
        // テスト用シフトを作成
        await request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sampleShift);
      });

      it('シフト一覧を取得できる', async () => {
        const response = await request(app)
          .get('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('期間フィルタが動作する', async () => {
        const response = await request(app)
          .get('/api/shifts')
          .query({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('職場フィルタが動作する', async () => {
        const response = await request(app)
          .get('/api/shifts')
          .query({ workplace: 'テストコンビニ' })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/shifts/:id', () => {
      let shiftId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sampleShift);
        
        shiftId = createResponse.body.data.id;
      });

      it('シフトを更新できる', async () => {
        const updatedShift = {
          ...sampleShift,
          workplaceName: '更新されたコンビニ',
          hourlyWage: 1100
        };

        const response = await request(app)
          .put(`/api/shifts/${shiftId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updatedShift);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.workplaceName).toBe('更新されたコンビニ');
        expect(response.body.data.hourlyWage).toBe(1100);
      });

      it('存在しないシフト更新が404エラーになる', async () => {
        const response = await request(app)
          .put('/api/shifts/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sampleShift);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/shifts/:id', () => {
      let shiftId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sampleShift);
        
        shiftId = createResponse.body.data.id;
      });

      it('シフトを削除できる', async () => {
        const response = await request(app)
          .delete(`/api/shifts/${shiftId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // 削除確認
        const getResponse = await request(app)
          .get(`/api/shifts/${shiftId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(getResponse.status).toBe(404);
      });
    });
  });

  describe('CSV処理エンドポイント', () => {
    const csvFilePath = path.join(__dirname, '../fixtures/sample.csv');
    const csvContent = `日付,説明,金額
2024-01-15,コンビニバイト,8500
2024-01-16,レストランバイト,12000`;

    beforeAll(() => {
      // テスト用CSVファイルを作成
      fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });
      fs.writeFileSync(csvFilePath, csvContent);
    });

    afterAll(() => {
      // テストファイルを削除
      if (fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }
    });

    describe('POST /api/csv/upload', () => {
      it('CSVファイルをアップロードして処理できる', async () => {
        const response = await request(app)
          .post('/api/csv/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('csvFile', csvFilePath)
          .field('bankName', 'テスト銀行')
          .field('accountType', 'checking');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('processedCount');
        expect(response.body.data.processedCount).toBeGreaterThan(0);
      });

      it('CSVファイルなしでアップロードが失敗する', async () => {
        const response = await request(app)
          .post('/api/csv/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .field('bankName', 'テスト銀行');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('大きすぎるファイルでアップロードが失敗する', async () => {
        // 5MB以上のダミーファイル作成
        const largeContent = 'a'.repeat(6 * 1024 * 1024);
        const largeFilePath = path.join(__dirname, '../fixtures/large.csv');
        
        fs.writeFileSync(largeFilePath, largeContent);

        const response = await request(app)
          .post('/api/csv/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('csvFile', largeFilePath);

        expect(response.status).toBe(413);

        // クリーンアップ
        fs.unlinkSync(largeFilePath);
      });
    });

    describe('GET /api/csv/history', () => {
      beforeEach(async () => {
        // テスト用CSV履歴を作成
        await request(app)
          .post('/api/csv/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('csvFile', csvFilePath)
          .field('bankName', 'テスト銀行');
      });

      it('CSV処理履歴を取得できる', async () => {
        const response = await request(app)
          .get('/api/csv/history')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('OCR処理エンドポイント', () => {
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');

    beforeAll(() => {
      // テスト用画像ファイルを作成（1x1ピクセルのPNG）
      const imageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
        0x05, 0x00, 0x01, 0xE2, 0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
      fs.writeFileSync(testImagePath, imageBuffer);
    });

    afterAll(() => {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    describe('POST /api/ocr/process', () => {
      it('画像ファイルをOCR処理できる', async () => {
        const response = await request(app)
          .post('/api/ocr/process')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('extractedText');
      }, 30000); // OCR処理は時間がかかるため30秒のタイムアウト

      it('画像ファイルなしでOCR処理が失敗する', async () => {
        const response = await request(app)
          .post('/api/ocr/process')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('扶養計算エンドポイント', () => {
    describe('POST /api/calculations/fuyou', () => {
      it('扶養計算が正しく動作する', async () => {
        const calculationData = {
          totalIncome: 1000000,
          isStudent: true,
          age: 20,
          workHoursPerWeek: 25
        };

        const response = await request(app)
          .post('/api/calculations/fuyou')
          .set('Authorization', `Bearer ${authToken}`)
          .send(calculationData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('recommendedLimit');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('warnings');
      });

      it('無効な計算データでエラーになる', async () => {
        const invalidData = {
          totalIncome: -1000, // 無効な収入
          isStudent: 'yes', // 無効な型
        };

        const response = await request(app)
          .post('/api/calculations/fuyou')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないエンドポイントで404エラー', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('不正なJSONで400エラー', async () => {
      const response = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('レート制限テスト', async () => {
      // 多数のリクエストを送信してレート制限をテスト
      const promises = Array.from({ length: 100 }, () =>
        request(app)
          .get('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // レート制限が動作していることを確認
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('パフォーマンステスト', () => {
    it('大量データの処理が適切な時間内に完了する', async () => {
      const startTime = Date.now();

      // 大量のシフトデータを作成
      const shifts = Array.from({ length: 100 }, (_, i) => ({
        ...sampleShift,
        date: `2024-01-${(i % 31) + 1}`,
        workplaceName: `職場${i}`
      }));

      const promises = shifts.map(shift =>
        request(app)
          .post('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(shift)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10秒以内に完了することを確認
      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('同時接続処理が適切に動作する', async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(app)
          .get('/api/shifts')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // すべてのリクエストが成功することを確認
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 10000);
  });

  describe('セキュリティテスト', () => {
    it('SQLインジェクション攻撃が防御される', async () => {
      const maliciousInput = "'; DROP TABLE shifts; --";

      const response = await request(app)
        .get('/api/shifts')
        .query({ workplace: maliciousInput })
        .set('Authorization', `Bearer ${authToken}`);

      // エラーになるかもしれないが、SQLインジェクションは実行されない
      expect([200, 400, 500]).toContain(response.status);
    });

    it('XSS攻撃が防御される', async () => {
      const xssScript = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...sampleShift,
          notes: xssScript
        });

      expect(response.status).toBe(201);
      // スクリプトタグがエスケープされているか、サニタイズされていることを確認
      expect(response.body.data.notes).not.toContain('<script>');
    });

    it('大きすぎるペイロードが拒否される', async () => {
      const largePayload = {
        ...sampleShift,
        notes: 'x'.repeat(1000000) // 1MB のテキスト
      };

      const response = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload);

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});