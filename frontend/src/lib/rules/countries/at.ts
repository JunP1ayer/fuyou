// Austria (AT) — Geringfügigkeitsgrenze placeholders; real values remote
export function getAtLimits(date = new Date()) {
  const geringMonthly = 518; // EUR/month (placeholder)
  return {
    taxAnnual: geringMonthly * 12,
    healthDependentAnnual: undefined,
    socialMonthly: geringMonthly,
    currency: 'EUR' as const,
    labels: {
      tax: 'Geringfügigkeit (annualised)',
      hifu130: '—',
      shaho106: 'Geringfügigkeit (monthly)',
    },
  };
}


