import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import xlsx from 'xlsx';
import pdf from 'pdf-parse';
import csvParser from 'csv-parser';
import { requireAuthOrDemo } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { aiFileAnalysisService } from '../services/aiFileAnalysisService';

const router = express.Router();

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('サポートされていないファイル形式です'));
    }
  },
});

// Excel解析関数
async function parseExcelFile(filePath: string): Promise<any[]> {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // JSONに変換
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // シフト情報を抽出（ヒューリスティック）
    const shifts = extractShiftsFromTable(jsonData);
    
    return shifts;
  } catch (error) {
    throw new Error(`Excel解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// CSV解析関数
async function parseCsvFile(filePath: string): Promise<any[]> {
  try {
    const fileStream = require('fs').createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      
      fileStream
        .pipe(csvParser())
        .on('data', (data: any) => records.push(data))
        .on('error', (err: any) => reject(err))
        .on('end', () => {
          try {
            const shifts = extractShiftsFromTable(records);
            resolve(shifts);
          } catch (error) {
            reject(error);
          }
        });
    });
  } catch (error) {
    throw new Error(`CSV解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PDF解析関数
async function parsePdfFile(filePath: string): Promise<any[]> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    // テキストからシフト情報を抽出
    const shifts = extractShiftsFromText(data.text);
    
    return shifts;
  } catch (error) {
    throw new Error(`PDF解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// テーブルデータからシフト情報を抽出
function extractShiftsFromTable(tableData: any[][]): any[] {
  const shifts: any[] = [];
  
  // ヘッダー行を特定
  let headerRowIndex = -1;
  const datePattern = /日付|date|日|曜日/i;
  const timePattern = /時間|time|開始|終了|start|end/i;
  
  for (let i = 0; i < Math.min(5, tableData.length); i++) {
    const row = tableData[i];
    if (Array.isArray(row)) {
      const hasDateColumn = row.some(cell => 
        typeof cell === 'string' && datePattern.test(cell)
      );
      const hasTimeColumn = row.some(cell => 
        typeof cell === 'string' && timePattern.test(cell)
      );
      
      if (hasDateColumn || hasTimeColumn) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    // ヘッダーが見つからない場合は最初の行をヘッダーとして扱う
    headerRowIndex = 0;
  }
  
  const headers = tableData[headerRowIndex] || [];
  
  // カラムインデックスを特定
  const dateColIndex = findColumnIndex(headers, /日付|date|日/i);
  const startTimeColIndex = findColumnIndex(headers, /開始|start|始/i);
  const endTimeColIndex = findColumnIndex(headers, /終了|end|終/i);
  const jobColIndex = findColumnIndex(headers, /職場|job|勤務先|店舗/i);
  
  // データ行を処理
  for (let i = headerRowIndex + 1; i < tableData.length; i++) {
    const row = tableData[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    
    try {
      const dateStr = row[dateColIndex] || '';
      const startTime = row[startTimeColIndex] || '';
      const endTime = row[endTimeColIndex] || '';
      const jobName = row[jobColIndex] || 'シフト';
      
      // 日付の解析
      const date = parseDate(dateStr);
      if (!date) continue;
      
      // 時間の解析
      const parsedStartTime = parseTime(startTime);
      const parsedEndTime = parseTime(endTime);
      
      if (parsedStartTime && parsedEndTime) {
        shifts.push({
          date: date.toISOString().split('T')[0],
          startTime: parsedStartTime,
          endTime: parsedEndTime,
          jobSourceName: String(jobName).trim(),
          isConfirmed: false,
        });
      }
    } catch (error) {
      // 行の解析エラーは無視して続行
      continue;
    }
  }
  
  return shifts;
}

// テキストからシフト情報を抽出
function extractShiftsFromText(text: string): any[] {
  const shifts: any[] = [];
  const lines = text.split('\n');
  
  // 日付と時間のパターンを検索
  const dateTimePattern = /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(\d{1,2}:\d{2})\s*[-〜~]\s*(\d{1,2}:\d{2})/g;
  
  for (const line of lines) {
    let match;
    while ((match = dateTimePattern.exec(line)) !== null) {
      try {
        const [, dateStr, startTime, endTime] = match;
        
        const date = parseDate(dateStr);
        if (!date) continue;
        
        shifts.push({
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          jobSourceName: 'PDF取込',
          isConfirmed: false,
        });
      } catch (error) {
        continue;
      }
    }
  }
  
  return shifts;
}

// ヘルパー関数
function findColumnIndex(headers: any[], pattern: RegExp): number {
  for (let i = 0; i < headers.length; i++) {
    if (typeof headers[i] === 'string' && pattern.test(headers[i])) {
      return i;
    }
  }
  return -1;
}

function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  const str = String(dateStr).trim();
  
  // Excel日付シリアル値の場合
  if (typeof dateStr === 'number' && dateStr > 25569) {
    return new Date((dateStr - 25569) * 86400 * 1000);
  }
  
  // 文字列の日付解析
  const patterns = [
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // MM/DD/YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,  // MM/DD/YY
    /(\d{1,2})[\/\-](\d{1,2})/,               // MM/DD (current year)
  ];
  
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      let year, month, day;
      
      if (pattern.source.includes('\\d{4}')) {
        if (match[1].length === 4) {
          [, year, month, day] = match;
        } else {
          [, month, day, year] = match;
        }
      } else if (match[3]) {
        [, month, day, year] = match;
        year = `20${year}`;
      } else {
        [, month, day] = match;
        year = new Date().getFullYear().toString();
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

function parseTime(timeStr: any): string | null {
  if (!timeStr) return null;
  
  const str = String(timeStr).trim();
  const timePattern = /(\d{1,2}):(\d{2})/;
  const match = str.match(timePattern);
  
  if (match) {
    const [, hours, minutes] = match;
    const h = parseInt(hours);
    const m = parseInt(minutes);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

// API エンドポイント

// 統合ファイル解析（OpenAI/Gemini使用）
router.post('/analyze', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    // AIファイル解析サービスを使用
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    
    // 結果を標準化
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'ai-analysis',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
        metadata: {
          originalShiftsCount: result.shifts.length,
          analysisProvider: result.provider,
        },
      },
    });
  } catch (error) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {}
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'ファイル解析中にエラーが発生しました',
    });
  }
}));

// 画像専用エンドポイント（後方互換性）
router.post('/image', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    // 画像の場合もAI解析を使用
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'image',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {}
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR処理中にエラーが発生しました',
    });
  }
}));

// Excel解析（AI使用）
router.post('/excel', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'excel',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {}
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Excel解析中にエラーが発生しました',
    });
  }
}));

// CSV解析（AI使用）
router.post('/csv', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'csv',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {}
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'CSV解析中にエラーが発生しました',
    });
  }
}));

// PDF解析（AI使用）
router.post('/pdf', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'pdf',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {}
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'PDF解析中にエラーが発生しました',
    });
  }
}));

export default router;