// 年次のしきい値（JP）
export const JP_RULES = [
  {
    effectiveFrom: '2025-01-01',
    taxAnnual: 1_230_000, // 税の目安（123万）
    healthDependentAnnual: 1_300_000, // 健保の被扶養（130万）
    socialMonthly: 88_000, // 106万の月額目安
  },
  {
    effectiveFrom: '2000-01-01',
    taxAnnual: 1_030_000, // 税の目安（103万）
    healthDependentAnnual: 1_300_000,
    socialMonthly: 88_000,
  },
] as const;

export function getJpRuleByDate(date = new Date()) {
  const target = JP_RULES.find(r => new Date(r.effectiveFrom) <= date);
  return target || JP_RULES[JP_RULES.length - 1];
}

export type WallKey = 'tax' | 'hifu130' | 'shaho106';

export const WALL_LABEL: Record<WallKey, string> = {
  tax: '税の目安',
  hifu130: '130万（健保）',
  shaho106: '106万（社保）',
};

export function getAnnualLimitByWall(key: WallKey, date = new Date()): number {
  const r = getJpRuleByDate(date);
  switch (key) {
    case 'tax':
      return r.taxAnnual;
    case 'hifu130':
      return r.healthDependentAnnual;
    case 'shaho106':
      return 1_060_000;
  }
}
