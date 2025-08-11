// Denmark (DK) — SU fribeløb style placeholders; real values should be loaded remotely
export function getDkLimits(date = new Date()) {
  // Example 2025-ish placeholder values
  const monthlyFree = 13900; // DKK/month (placeholder)
  const annualFree = monthlyFree * 12;
  return {
    taxAnnual: annualFree,
    healthDependentAnnual: undefined,
    socialMonthly: monthlyFree,
    currency: 'DKK' as const,
    labels: {
      tax: 'SU fribeløb (årlig)',
      hifu130: '—',
      shaho106: 'SU fribeløb (månedlig)',
    },
  };
}


