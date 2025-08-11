import { getJpRuleByDate } from '../../fuyou/config';

export function getJpLimits(date = new Date()) {
  const r = getJpRuleByDate(date);
  return {
    taxAnnual: r.taxAnnual,
    healthDependentAnnual: r.healthDependentAnnual,
    socialMonthly: r.socialMonthly,
    currency: 'JPY' as const,
    labels: {
      tax: '税の目安',
      hifu130: '130万（健保）',
      shaho106: '106万（社保）',
    },
  };
}


