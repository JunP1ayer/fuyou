// Poland (PL) — PIT exemption for under 26 (Bez PIT dla młodych) placeholders
export function getPlLimits(date = new Date()) {
  const annualCap = 85528; // PLN/year (placeholder)
  const monthlySoft = Math.round(annualCap / 12);
  return {
    taxAnnual: annualCap,
    healthDependentAnnual: undefined,
    socialMonthly: monthlySoft,
    currency: 'PLN' as const,
    labels: {
      tax: 'PIT exemption <26y (rocznie)',
      hifu130: '—',
      shaho106: 'Miesięczny przelicznik',
    },
  };
}


