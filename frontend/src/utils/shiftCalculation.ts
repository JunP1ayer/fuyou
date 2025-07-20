import { JobTemplate } from '../components/JobManagement';

export interface ShiftCalculationResult {
  workingHours: number;
  regularHours: number;
  nightHours: number;
  weekendHours: number;
  regularEarnings: number;
  nightEarnings: number;
  weekendEarnings: number;
  transportationCost: number;
  totalEarnings: number;
  breakdown: {
    label: string;
    hours: number;
    rate: number;
    earnings: number;
  }[];
}

/**
 * シフトの収入を詳細計算する（深夜時給・土日時給対応）
 */
export function calculateShiftEarnings(
  job: JobTemplate,
  date: string,
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): ShiftCalculationResult {
  const shiftDate = new Date(date);
  const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6; // 0=日曜, 6=土曜

  // 時間を分に変換
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // 翌日にまたがる場合を考慮
  const endMinutesAdjusted =
    endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;

  // 実労働時間（分）
  const totalWorkMinutes = endMinutesAdjusted - startMinutes - breakMinutes;
  const totalWorkHours = Math.max(0, totalWorkMinutes / 60);

  // 深夜時間帯の設定（デフォルト: 22:00-05:00）
  const nightStart = timeToMinutes(job.nightTimeStart || '22:00');
  const nightEnd = timeToMinutes(job.nightTimeEnd || '05:00');

  // 深夜時間帯は翌日にまたがることを考慮
  const nightEndAdjusted =
    nightEnd < nightStart ? nightEnd + 24 * 60 : nightEnd;

  // 各時間帯の労働時間を計算
  let regularHours = 0;
  let nightHours = 0;
  let weekendHours = 0;

  // 現在時刻から終了時刻まで1分刻みで計算
  for (let minute = startMinutes; minute < endMinutesAdjusted; minute++) {
    // 休憩時間は除外
    if (isBreakTime(minute, startMinutes, endMinutesAdjusted, breakMinutes)) {
      continue;
    }

    const currentMinute = minute >= 24 * 60 ? minute - 24 * 60 : minute; // 24時間を超えた場合の調整

    // 深夜時間帯の判定
    const isNightTime =
      (nightStart <= nightEndAdjusted &&
        currentMinute >= nightStart &&
        currentMinute < nightEndAdjusted) ||
      (nightStart > nightEndAdjusted &&
        (currentMinute >= nightStart || currentMinute < nightEndAdjusted));

    if (isWeekend) {
      weekendHours += 1 / 60; // 1分 = 1/60時間
    } else if (isNightTime) {
      nightHours += 1 / 60;
    } else {
      regularHours += 1 / 60;
    }
  }

  // 時給設定
  const regularRate = job.hourlyRate;
  const nightRate = job.nightHourlyRate || Math.round(job.hourlyRate * 1.25);
  const weekendRate = job.weekendHourlyRate || job.hourlyRate;

  // 収入計算
  const regularEarnings = regularHours * regularRate;
  const nightEarnings = nightHours * nightRate;
  const weekendEarnings = weekendHours * weekendRate;

  // 交通費計算
  let transportationCost = 0;
  if (
    job.transportationType === 'distance' &&
    job.transportationDistance &&
    job.transportationRatePerKm
  ) {
    transportationCost =
      job.transportationDistance * job.transportationRatePerKm * 2; // 往復
  } else {
    transportationCost = job.transportationCost || 0;
  }

  const totalEarnings =
    regularEarnings + nightEarnings + weekendEarnings + transportationCost;

  // 詳細内訳
  const breakdown = [];
  if (regularHours > 0) {
    breakdown.push({
      label: '通常時間',
      hours: regularHours,
      rate: regularRate,
      earnings: regularEarnings,
    });
  }
  if (nightHours > 0) {
    breakdown.push({
      label: '深夜時間',
      hours: nightHours,
      rate: nightRate,
      earnings: nightEarnings,
    });
  }
  if (weekendHours > 0) {
    breakdown.push({
      label: '土日時間',
      hours: weekendHours,
      rate: weekendRate,
      earnings: weekendEarnings,
    });
  }

  return {
    workingHours: totalWorkHours,
    regularHours,
    nightHours,
    weekendHours,
    regularEarnings,
    nightEarnings,
    weekendEarnings,
    transportationCost,
    totalEarnings,
    breakdown,
  };
}

/**
 * 時間文字列（HH:mm）を分に変換
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 指定された分が休憩時間に含まれるかチェック
 * 簡易実装：終了時刻から休憩時間分遡った時間を休憩とする
 */
function isBreakTime(
  currentMinute: number,
  startMinutes: number,
  endMinutes: number,
  breakMinutes: number
): boolean {
  if (breakMinutes <= 0) return false;

  // 簡易実装：勤務の中間時間を休憩時間とする
  const workMinutes = endMinutes - startMinutes;
  const breakStart =
    startMinutes + Math.floor((workMinutes - breakMinutes) / 2);
  const breakEnd = breakStart + breakMinutes;

  return currentMinute >= breakStart && currentMinute < breakEnd;
}

/**
 * シンプルな収入計算（後方互換性のため）
 */
export function calculateSimpleEarnings(
  job: JobTemplate,
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): { workingHours: number; earnings: number } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const workMinutes = endMinutes - startMinutes - breakMinutes;
  const workingHours = Math.max(0, workMinutes / 60);
  const earnings =
    workingHours * job.hourlyRate + (job.transportationCost || 0);

  return { workingHours, earnings };
}
