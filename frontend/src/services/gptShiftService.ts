// 🤖 GPT-5シフト解析サービス

export interface WorkplaceOption {
  id: string;
  name: string;
  defaultHourlyRate: number;
  color: string;
}

export interface ShiftSubmissionData {
  workplaceId: string;
  workplaceName: string;
  shiftText: string;
  submittedAt: string;
}

export interface AnalyzedShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workplaceName: string;
  hourlyRate: number;
  totalEarnings: number;
  status: 'confirmed' | 'tentative';
  confidence: number; // GPTの解析信頼度 (0-1)
  rawText?: string; // 元のテキスト
  workerName?: string; // 解析対象者名（任意）
}

export interface ShiftAnalysisResult {
  success: boolean;
  shifts: AnalyzedShift[];
  warnings: string[];
  totalShifts: number;
  estimatedEarnings: number;
}

// GPT-5 API呼び出し (模擬実装)
export const analyzeShiftText = async (
  shiftText: string,
  workplace?: WorkplaceOption,
  workerName?: string
): Promise<ShiftAnalysisResult> => {
  // 実際の実装ではGPT-5 APIを呼び出し
  // ここでは模擬的な解析を行う

  // 簡単なパターンマッチング（GPT-5の代わり）
  const lines = shiftText.split('\n').filter(line => line.trim());
  const shifts: AnalyzedShift[] = [];
  const warnings: string[] = [];

  console.log('🤖 GPT-5でシフト解析中...', {
    shiftText,
    workplace: workplace || '未設定',
    workerName,
  });

  // 模擬的な遅延（GPT API呼び出しをシミュレート）
  await new Promise(resolve => setTimeout(resolve, 1500));

  for (const line of lines) {
    const shift = parseShiftLine(line, workplace, workerName);
    if (shift) {
      shifts.push(shift);
    } else if (line.trim()) {
      warnings.push(`解析できませんでした: "${line}"`);
    }
  }

  const totalEarnings = shifts.reduce(
    (sum, shift) => sum + shift.totalEarnings,
    0
  );

  return {
    success: true,
    shifts,
    warnings,
    totalShifts: shifts.length,
    estimatedEarnings: totalEarnings,
  };
};

// シフト行の解析（GPT-5の代替として簡易実装）
const parseShiftLine = (
  line: string,
  workplace?: WorkplaceOption,
  workerName?: string
): AnalyzedShift | null => {
  // 日付パターンを検索
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})/, // MM/DD
    /(\d{1,2})月(\d{1,2})日/, // MM月DD日
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
  ];

  // 時間パターンを検索
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~〜]\s*(\d{1,2}):(\d{2})/, // HH:MM-HH:MM
    /(\d{1,2})時(\d{0,2})\s*[-~〜]\s*(\d{1,2})時(\d{0,2})/, // HH時MM-HH時MM
    /(\d{1,2})\s*[-~〜]\s*(\d{1,2})/, // HH-HH
  ];

  let date: string | null = null;
  let startTime: string | null = null;
  let endTime: string | null = null;

  // 日付解析
  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      const currentYear = new Date().getFullYear();
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      break;
    }
  }

  // 時間解析
  for (const pattern of timePatterns) {
    const match = line.match(pattern);
    if (match) {
      if (pattern.source.includes('時')) {
        // 時間形式
        const startHour = parseInt(match[1]);
        const startMin = match[2] ? parseInt(match[2]) : 0;
        const endHour = parseInt(match[3]);
        const endMin = match[4] ? parseInt(match[4]) : 0;
        startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      } else if (match.length === 5) {
        // HH:MM-HH:MM形式
        startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
        endTime = `${match[3].padStart(2, '0')}:${match[4]}`;
      } else {
        // 単純なHH-HH形式
        startTime = `${match[1].padStart(2, '0')}:00`;
        endTime = `${match[2].padStart(2, '0')}:00`;
      }
      break;
    }
  }

  if (!date || !startTime || !endTime) {
    return null;
  }

  // 労働時間計算
  const start = new Date(`2024-01-01T${startTime}`);
  const end = new Date(`2024-01-01T${endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const hourlyRate = workplace?.defaultHourlyRate ?? 1000;
  const totalEarnings = Math.floor(hours * hourlyRate);

  return {
    id: `gpt-shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date,
    startTime,
    endTime,
    workplaceName: workplace?.name ?? '未設定',
    hourlyRate,
    totalEarnings,
    status: 'tentative', // GPT解析は初期状態では仮
    confidence: 0.85, // 解析信頼度
    rawText: line,
    workerName,
  };
};

// 実際のGPT-5 API呼び出し (将来の実装用)
export const callGPT5API = async (prompt: string): Promise<string> => {
  // 実装例:
  // const response = await fetch('/api/gpt5', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt })
  // })
  // return response.json()

  throw new Error('GPT-5 API integration not implemented yet');
};

// GPT-5用のプロンプト生成
export const generateShiftAnalysisPrompt = (
  shiftText: string,
  workplace: WorkplaceOption
): string => {
  return `
以下のシフト情報を解析して、構造化されたデータとして抽出してください。

勤務先情報:
- 名前: ${workplace.name}
- 時給: ${workplace.defaultHourlyRate}円

シフトテキスト:
${shiftText}

以下のJSON形式で返してください:
{
  "shifts": [
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "confidence": 0.0-1.0
    }
  ],
  "warnings": ["解析できなかった行や不明な点"]
}

注意点:
- 日付が年なしの場合は現在年を補完
- 時間は24時間形式で
- 不明確な情報は confidence を下げる
- 解析できない行は warnings に含める
`.trim();
};
