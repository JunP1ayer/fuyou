// Minimal UK safe limits (placeholder values — to be managed server-side later)
// Personal Allowance and NI thresholds change yearly; keep as soft guidance.

export function getUkLimits(date = new Date()) {
  // Placeholder 2024/25 style figures (example-only). Replace from server later.
  const personalAllowance = 12_570; // GBP/year
  const niPrimaryThresholdMonthly = 1_048; // GBP/month (approx)
  return {
    taxAnnual: personalAllowance,
    healthDependentAnnual: undefined,
    socialMonthly: niPrimaryThresholdMonthly,
    currency: 'GBP' as const,
    labels: {
      tax: 'Personal Allowance',
      hifu130: 'N/A',
      shaho106: 'NI threshold (monthly)',
    },
  };
}


