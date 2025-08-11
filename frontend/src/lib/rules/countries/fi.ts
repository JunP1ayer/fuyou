// Finland (FI) — Kela tuloraja style placeholders; load exact figures remotely
export function getFiLimits(date = new Date()) {
  const annualCap = 15000; // EUR/year (placeholder)
  const monthlySoft = Math.round(annualCap / 12);
  return {
    taxAnnual: annualCap,
    healthDependentAnnual: undefined,
    socialMonthly: monthlySoft,
    currency: 'EUR' as const,
    labels: {
      tax: 'Kela tuloraja (vuosi)',
      hifu130: '—',
      shaho106: 'Kela tuloraja (kk 目安)',
    },
  };
}


