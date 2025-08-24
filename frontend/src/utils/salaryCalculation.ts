// 給料計算ユーティリティ（締日・支給日考慮）

interface PaymentSchedule {
  cutoffDay: number; // 締日 (1-31)
  paymentDay: number; // 支給日 (1-31)
  paymentTiming: 'nextMonth' | 'sameMonth'; // 翌月/当月
}

/**
 * シフトの日付から実際に給料が支払われる年月を計算
 * @param shiftDate シフトの日付
 * @param schedule 締日・支給日の設定
 * @returns 支給年月（YYYY-MM形式）
 */
export function getPaymentMonth(
  shiftDate: Date | string,
  schedule: PaymentSchedule
): string {
  const date = typeof shiftDate === 'string' ? new Date(shiftDate) : shiftDate;
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  let paymentYear = year;
  let paymentMonth = month;

  // 実際の締日を計算（月末締めの場合は、その月の最終日を使用）
  let actualCutoffDay = schedule.cutoffDay;
  if (schedule.cutoffDay >= 28) {
    // 月末締めの場合、その月の最終日を取得
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    actualCutoffDay = Math.min(schedule.cutoffDay, lastDayOfMonth);
  }

  // 締日を過ぎているかチェック
  if (day <= actualCutoffDay) {
    // 締日以前の場合、当月締め
    if (schedule.paymentTiming === 'nextMonth') {
      // 翌月支給
      paymentMonth = month + 1;
      if (paymentMonth > 11) {
        paymentMonth = 0;
        paymentYear++;
      }
    }
    // sameMonthの場合は当月支給なのでそのまま
  } else {
    // 締日を過ぎている場合、翌月締め
    paymentMonth = month + 1;
    if (paymentMonth > 11) {
      paymentMonth = 0;
      paymentYear++;
    }
    
    if (schedule.paymentTiming === 'nextMonth') {
      // さらに翌月支給
      paymentMonth++;
      if (paymentMonth > 11) {
        paymentMonth = 0;
        paymentYear++;
      }
    }
  }

  // YYYY-MM形式で返す
  return `${paymentYear}-${(paymentMonth + 1).toString().padStart(2, '0')}`;
}

/**
 * デフォルトの締日・支給日設定
 * 一般的な設定：月末締め、翌月25日支給
 */
export const DEFAULT_PAYMENT_SCHEDULE: PaymentSchedule = {
  cutoffDay: 31, // 月末締め
  paymentDay: 25, // 25日支給
  paymentTiming: 'nextMonth' // 翌月支給
};

/**
 * 複数のシフトを支給月ごとにグループ化
 * @param shifts シフトの配列
 * @param getSchedule シフトから締日・支給日設定を取得する関数
 * @returns 支給月ごとにグループ化されたシフト
 */
export function groupShiftsByPaymentMonth<T extends { date: string }>(
  shifts: T[],
  getSchedule: (shift: T) => PaymentSchedule
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  shifts.forEach(shift => {
    const schedule = getSchedule(shift);
    const paymentMonth = getPaymentMonth(shift.date, schedule);
    
    if (!grouped[paymentMonth]) {
      grouped[paymentMonth] = [];
    }
    grouped[paymentMonth].push(shift);
  });

  return grouped;
}

/**
 * 締日から給料計算期間を取得
 * @param yearMonth 対象年月（YYYY-MM）
 * @param cutoffDay 締日
 * @returns 計算期間の開始日と終了日
 */
export function getPaymentPeriod(
  yearMonth: string,
  cutoffDay: number
): { start: Date; end: Date } {
  const [year, month] = yearMonth.split('-').map(Number);
  
  // 締日が月末の場合の特別処理
  const isEndOfMonth = cutoffDay >= 28;
  
  let startYear = year;
  let startMonth = month - 2; // 前月の締日翌日から
  if (startMonth < 0) {
    startMonth += 12;
    startYear--;
  }
  
  let endYear = year;
  let endMonth = month - 1; // 当月の締日まで
  if (endMonth < 0) {
    endMonth += 12;
    endYear--;
  }

  // 開始日：前月の締日翌日
  const start = new Date(startYear, startMonth, cutoffDay + 1);
  
  // 終了日：当月の締日
  let end: Date;
  if (isEndOfMonth) {
    // 月末締めの場合、その月の最終日
    end = new Date(endYear, endMonth + 1, 0);
  } else {
    end = new Date(endYear, endMonth, cutoffDay);
  }

  return { start, end };
}