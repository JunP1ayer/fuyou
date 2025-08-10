// 2025年制度のしきい値設定
export const RULE_SET = {
  year: 2025,
  // 税の扶養・配偶者控除の壁
  tax123: 1_230_000,
  // 健保の被扶養の壁
  hifu130: 1_300_000,
  // 社保加入の目安（月額換算 8.8万円）
  shahoMonthly: 88_000,
} as const;

export type WallKey = 'tax123' | 'hifu130' | 'shaho106';

export const WALL_LABEL: Record<WallKey, string> = {
  tax123: '123万（税）',
  hifu130: '130万（健保）',
  shaho106: '106万（社保）',
};

export function getAnnualLimitByWall(key: WallKey): number {
  switch (key) {
    case 'tax123':
      return RULE_SET.tax123;
    case 'hifu130':
      return RULE_SET.hifu130;
    case 'shaho106':
      // 106万は会社の社保加入要件で、厳密には複合条件（週20h、月額8.8万円、所定期間など）。
      // 年間目安として 1,060,000 を提示し、ウィザードで厳密判定へ誘導する。
      return 1_060_000;
  }
}
