// Minimal DE safe limits (placeholder values — to be managed server-side later)
// Minijob cap and student 20h rule are used as soft guidance.

export function getDeLimits(date = new Date()) {
  const minijobMonthly = 538; // EUR/month (example cap; subject to change)
  return {
    taxAnnual: minijobMonthly * 12, // Soft annualised cap for UI guidance
    healthDependentAnnual: undefined,
    socialMonthly: minijobMonthly,
    currency: 'EUR' as const,
    labels: {
      tax: 'Minijob (annualised)',
      hifu130: 'N/A',
      shaho106: 'Minijob monthly',
    },
  };
}


