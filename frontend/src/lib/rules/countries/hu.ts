// Hungary (HU) — 25歳以下 PIT免除 placeholders
export function getHuLimits(date = new Date()) {
  const monthlyCap = 600000; // HUF/month (placeholder)
  return {
    taxAnnual: monthlyCap * 12,
    healthDependentAnnual: undefined,
    socialMonthly: monthlyCap,
    currency: 'HUF' as const,
    labels: {
      tax: 'Under 25 PIT relief (annualised)',
      hifu130: '—',
      shaho106: 'Monthly threshold (approx)',
    },
  };
}


