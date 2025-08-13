import type { Workplace } from '@/types/simple';

export interface EarningsParams {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  manualBreakMinutes?: number; // 手動休憩（分）
  isPersonal?: boolean; // プライベート扱い
  shiftDate?: string; // YYYY-MM-DD for weekday calculation
}

export function computeShiftEarnings(
  workplace: Partial<Workplace> | null | undefined,
  params: EarningsParams,
): { totalEarnings: number; actualMinutes: number; breakMinutes: number; baseRate: number } {
  const { startTime, endTime, manualBreakMinutes = 0, isPersonal, shiftDate } = params;
  if (isPersonal) return { totalEarnings: 0, actualMinutes: 0, breakMinutes: 0, baseRate: 0 };

  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);
  if (end.getTime() <= start.getTime()) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
  const workHours = totalMinutes / 60;

  // 休憩時間の計算（手動休憩を最優先）
  let breakMinutes = 0;
  
  if (manualBreakMinutes && manualBreakMinutes > 0) {
    breakMinutes = manualBreakMinutes;
  } else {
    // 自由休憩（常に適用）
    let freeBreak = 0;
    if (workplace?.freeBreakDefault && workplace.freeBreakDefault > 0) {
      freeBreak = Math.max(0, workplace.freeBreakDefault);
    }

    // 自動休憩（最も長いルールのみ適用）
    let autoBreak = 0;
    if (workHours > 8) {
      if (workplace?.breakAuto8hEnabled && workplace?.breakRules?.over8h) {
        autoBreak = workplace.breakRules.over8h;
      } else if (workplace?.autoBreak8Hours) {
        autoBreak = 60; // 旧フィールドのフォールバック
      }
    } else if (workHours > 6) {
      if (workplace?.breakAuto6hEnabled && workplace?.breakRules?.over6h) {
        autoBreak = workplace.breakRules.over6h;
      } else if (workplace?.autoBreak6Hours) {
        autoBreak = 45; // 旧フィールドのフォールバック
      }
    } else if (workHours > 4) {
      if (workplace?.breakAuto4hEnabled && workplace?.breakRules?.over4h) {
        autoBreak = workplace.breakRules.over4h;
      }
    }

    // 自由休憩と自動休憩は「大きい方のみ」を採用（重複控除）
    breakMinutes = Math.max(freeBreak, autoBreak);
  }

  const actualMinutesInitial = Math.max(0, totalMinutes - breakMinutes);
  // 基本時給の決定
  let baseRate = workplace?.defaultHourlyRate ?? 0;
  
  // 曜日別時給の適用（設定があれば優先）
  if (workplace?.weekdayRates && shiftDate) {
    const date = new Date(shiftDate);
    const dayOfWeek = date.getDay();
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = weekdayNames[dayOfWeek] as keyof typeof workplace.weekdayRates;
    const dayRate = workplace.weekdayRates?.[dayName];
    if (dayRate && dayRate > 0) {
      baseRate = dayRate;
    }
  }
  
  // 時間帯別レート按分のためのセグメント化
  type Segment = { start: number; end: number; isNight: boolean; rate: number };
  const segments: Segment[] = [];
  const sMin = start.getHours() * 60 + start.getMinutes();
  let eMin = end.getHours() * 60 + end.getMinutes();
  if (eMin <= sMin) eMin += 24 * 60; // 翌日

  const NIGHT_START = 22 * 60;
  const NIGHT_END = 5 * 60;

  // 境界リスト（開始・終了・深夜境界・時間帯境界）
  const boundaries = new Set<number>([sMin, eMin, NIGHT_START, 24 * 60, 24 * 60 + NIGHT_END]);
  if (workplace?.timeBasedRates && workplace.timeBasedRates.length > 0) {
    for (const band of workplace.timeBasedRates) {
      const [bSH, bSM] = band.startTime.split(':').map(Number);
      const [bEH, bEM] = band.endTime.split(':').map(Number);
      let bS = bSH * 60 + bSM;
      let bE = bEH * 60 + bEM;
      if (bE <= bS) bE += 24 * 60; // 跨ぎ帯
      // 帯の境界がシフト範囲に触れる場合のみ追加
      if (!(eMin <= bS || sMin >= bE)) {
        boundaries.add(Math.max(sMin, Math.min(eMin, bS)));
        boundaries.add(Math.max(sMin, Math.min(eMin, bE)));
      }
    }
  }
  // ソート
  const sorted = Array.from(boundaries).filter(v => v >= sMin && v <= eMin).sort((a,b)=>a-b);
  for (let i=0;i<sorted.length-1;i++) {
    const a = sorted[i];
    const b = sorted[i+1];
    if (b <= a) continue;
    // セグメント中心時刻
    const mid = a + (b - a)/2;
    // 深夜判定（22:00-24:00、または0:00-5:00）
    const isNight = (mid >= NIGHT_START && mid < 24*60) || (mid >= 24*60 && mid < 24*60 + NIGHT_END);
    // レート決定（時間帯別がヒットすればそれ、なければbaseRate）
    let segRate = baseRate;
    if (workplace?.timeBasedRates && workplace.timeBasedRates.length > 0) {
      for (const band of workplace.timeBasedRates) {
        const [bSH, bSM] = band.startTime.split(':').map(Number);
        const [bEH, bEM] = band.endTime.split(':').map(Number);
        let bS = bSH * 60 + bSM;
        let bE = bEH * 60 + bEM;
        if (bE <= bS) bE += 24 * 60;
        let m = mid;
        if (m < bS && bE >= 24*60) m += 24*60;
        if (m >= bS && m < bE && band.rate > 0) { segRate = band.rate; break; }
      }
    }
    segments.push({ start: a, end: b, isNight, rate: segRate });
  }

  // 休憩をセグメントへ配分（通常→深夜の順で控除）
  let breakLeft = breakMinutes;
  for (const seg of segments) {
    if (breakLeft <= 0) break;
    if (!seg.isNight) {
      const segLen = seg.end - seg.start;
      const cut = Math.min(segLen, breakLeft);
      seg.start += cut; // 前方から控除
      breakLeft -= cut;
    }
  }
  if (breakLeft > 0) {
    for (const seg of segments) {
      if (breakLeft <= 0) break;
      if (seg.isNight) {
        const segLen = seg.end - seg.start;
        const cut = Math.min(segLen, breakLeft);
        seg.start += cut;
        breakLeft -= cut;
      }
    }
  }

  // 実働合計
  const actualMinutesAfter = Math.max(0, segments.reduce((m, s)=> m + Math.max(0, s.end - s.start), 0));
  const actualHoursAfter = actualMinutesAfter / 60;

  // 残業分を末尾から配分
  let overtimeLeft = Math.max(0, actualMinutesAfter - 8*60);
  let pay = 0;
  // 順に計算
  for (let i=0;i<segments.length;i++) {
    const seg = segments[i];
    const segLen = Math.max(0, seg.end - seg.start);
    if (segLen <= 0) continue;
    const nightMul = seg.isNight ? 1.25 : 1.0;
    // このセグメントのうち残業扱いにする分（後ろから配分するが簡略化で全体に均すのではなく、最後の方に位置するセグメントほど残業に近い。ここでは近似として前から計算し、最後に別ループで残業加算するより、積み上げ後で残業分に+0.25を付与する方針にする。）
    // より正確には末尾から配分する必要があるため、ここでは2パス計算にする。
  }
  // 1パス目: 深夜/通常の基本支払い
  pay = segments.reduce((sum, seg)=>{
    const len = Math.max(0, seg.end - seg.start);
    if (len <= 0) return sum;
    const nightMul = seg.isNight ? 1.25 : 1.0;
    return sum + (len/60) * seg.rate * nightMul;
  }, 0);
  // 2パス目: 残業+0.25を末尾から付与
  overtimeLeft = Math.max(0, actualMinutesAfter - 8*60);
  for (let i=segments.length-1; i>=0 && overtimeLeft>0; i--) {
    const seg = segments[i];
    const len = Math.max(0, seg.end - seg.start);
    if (len <= 0) continue;
    const use = Math.min(len, overtimeLeft);
    pay += (use/60) * seg.rate * 0.25; // 夜でも通常でも+0.25（夜は合計1.5xになる）
    overtimeLeft -= use;
  }

  const totalEarnings = Math.round(pay);

  return { totalEarnings, actualMinutes: actualMinutesAfter, breakMinutes, baseRate };
}


