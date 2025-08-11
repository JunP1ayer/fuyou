// Norway (NO) — Lånekassen fribeløp style placeholders; use remote for real
export function getNoLimits(date = new Date()) {
  const annualCap = 215000; // NOK/year (placeholder)
  const monthlySoft = Math.round(annualCap / 12);
  return {
    taxAnnual: annualCap,
    healthDependentAnnual: undefined,
    socialMonthly: monthlySoft,
    currency: 'NOK' as const,
    labels: {
      tax: 'Fribeløp (årlig)',
      hifu130: '—',
      shaho106: 'Fribeløp (månedlig 目安)',
    },
  };
}


