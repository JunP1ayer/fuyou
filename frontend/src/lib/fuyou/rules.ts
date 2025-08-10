import { RULE_SET } from './config';

export interface WizardAnswers {
  categories?: string[];
  incomeJPY?: number;
  isStudent?: 'high' | 'vocational' | 'university' | 'no';
  studentException?: 'leave' | 'night' | 'graduate_soon' | 'none';
  contractLength?: 'over2m' | 'under2m';
  weeklyHours20?: boolean;
  officeSize51?: 'yes' | 'no' | 'unknown';
}

export interface RuleResultCard {
  title: string;
  status: 'ok' | 'warn' | 'ng' | 'maybe';
  message: string;
  reasons?: string[];
}

export interface WizardResult {
  cards: RuleResultCard[];
}

export function evaluateRules(ans: WizardAnswers): WizardResult {
  const cards: RuleResultCard[] = [];

  // 123万円（税）
  if ((ans.incomeJPY ?? 0) <= RULE_SET.tax123) {
    cards.push({
      title: '123万円の壁（税）',
      status: 'ok',
      message:
        '扶養/配偶者控除の対象になり得ます。最終判断は世帯の所得状況によって変わります。',
    });
  } else {
    cards.push({
      title: '123万円の壁（税）',
      status: 'warn',
      message:
        '配偶者特別控除帯、または扶養外の可能性があります（納税者の所得等で異なります）。',
    });
  }

  // 106万円（会社の社保）
  const reasons: string[] = [];
  let meet106 = true;
  // 昼間学生は適用拡大の対象外となるケースが多い（事業所判断）。
  if (ans.isStudent && ans.isStudent !== 'no') {
    meet106 = false;
    reasons.push('昼間学生は対象外の可能性');
  }
  if (ans.contractLength === 'under2m') {
    meet106 = false;
    reasons.push('雇用期間が2か月以内');
  }
  if (ans.weeklyHours20 === false) {
    meet106 = false;
    reasons.push('週20時間未満');
  }
  if (ans.officeSize51 === 'no') {
    meet106 = false;
    reasons.push('従業員51人未満（任意特定適用でなければ）');
  }
  if ((ans.incomeJPY ?? 0) < RULE_SET.shahoMonthly * 12) {
    meet106 = false;
    reasons.push('月額8.8万円未満');
  }

  cards.push({
    title: '106万円の壁（会社の社保）',
    status: meet106 ? 'warn' : 'ok',
    message: meet106
      ? '加入の可能性があります。勤務先へ確認してください。'
      : '現時点では加入の可能性は低いと考えられます。',
    reasons: reasons.length ? reasons : undefined,
  });

  // 130万円（健保の被扶養）
  if ((ans.incomeJPY ?? 0) >= RULE_SET.hifu130) {
    cards.push({
      title: '130万円の壁（健保の被扶養）',
      status: 'ng',
      message:
        '被扶養から外れる可能性があります。ご自身で加入、または会社の社保をご検討ください。',
    });
  } else {
    cards.push({
      title: '130万円の壁（健保の被扶養）',
      status: 'ok',
      message:
        '現時点の見込みでは被扶養の範囲内です。収入見込みが増える場合はご注意ください。',
    });
  }

  return { cards };
}
