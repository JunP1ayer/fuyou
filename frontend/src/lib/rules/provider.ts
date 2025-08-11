import { getJpLimits } from './countries/jp';
import { getUkLimits } from './countries/uk';
import { getDeLimits } from './countries/de';

export type CountryCode = 'JP' | 'UK' | 'DE';

export function getCountryLimits(country: CountryCode, date = new Date()) {
  switch (country) {
    case 'UK':
      return getUkLimits(date);
    case 'DE':
      return getDeLimits(date);
    case 'JP':
    default:
      return getJpLimits(date);
  }
}


