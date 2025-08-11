import { getJpLimits } from './countries/jp';
import { getUkLimits } from './countries/uk';
import { getDeLimits } from './countries/de';
import { getDkLimits } from './countries/dk';
import { getFiLimits } from './countries/fi';
import { getNoLimits } from './countries/no';
import { getAtLimits } from './countries/at';
import { getPlLimits } from './countries/pl';
import { getHuLimits } from './countries/hu';
import { fetchRemoteRulesOnce, getRemoteCountryLimits } from './remote';

export type CountryCode = 'JP' | 'UK' | 'DE' | 'DK' | 'FI' | 'NO' | 'AT' | 'PL' | 'HU';

export function getCountryLimits(country: CountryCode, date = new Date()) {
  const remote = getRemoteCountryLimits(country);
  if (remote) {
    return {
      taxAnnual: remote.taxAnnual,
      healthDependentAnnual: remote.healthDependentAnnual,
      socialMonthly: remote.socialMonthly,
      currency: (remote.currency || (country === 'UK' ? 'GBP' : country === 'DE' ? 'EUR' : 'JPY')) as 'JPY'|'GBP'|'EUR',
      labels: remote.labels || {},
    };
  }
  switch (country) {
    case 'DK':
      return getDkLimits(date);
    case 'FI':
      return getFiLimits(date);
    case 'NO':
      return getNoLimits(date);
    case 'AT':
      return getAtLimits(date);
    case 'PL':
      return getPlLimits(date);
    case 'HU':
      return getHuLimits(date);
    case 'UK':
      return getUkLimits(date);
    case 'DE':
      return getDeLimits(date);
    case 'JP':
    default:
      return getJpLimits(date);
  }
}

// Preload remote rules on app start (call from entry if needed)
export async function preloadCountryRules() {
  try { await fetchRemoteRulesOnce(); } catch {}
}


