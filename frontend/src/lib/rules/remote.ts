// Remote rules loader with localStorage cache (TTL: 24h)

export interface RemoteCountryRule {
  country: 'JP' | 'UK' | 'DE' | string;
  effectiveFrom?: string;
  taxAnnual?: number;
  healthDependentAnnual?: number;
  socialMonthly?: number;
  currency?: string;
  labels?: Record<string, string>;
}

interface RemoteRulesPayload {
  updatedAt?: string;
  rules: RemoteCountryRule[];
}

const CACHE_KEY = 'country-rules-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let inMemory: RemoteRulesPayload | null = null;

export function getCachedRemoteRules(): RemoteRulesPayload | null {
  if (inMemory) return inMemory;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    inMemory = payload;
    return inMemory;
  } catch {
    return null;
  }
}

export async function fetchRemoteRulesOnce(): Promise<RemoteRulesPayload | null> {
  const cached = getCachedRemoteRules();
  if (cached) return cached;
  const url = (import.meta as any)?.env?.VITE_RULES_URL || '/api/rules';
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const payload: RemoteRulesPayload = await resp.json();
    inMemory = payload;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload }));
    } catch {}
    return payload;
  } catch {
    return null;
  }
}

export function getRemoteCountryLimits(country: string): RemoteCountryRule | null {
  const data = getCachedRemoteRules();
  if (!data) return null;
  const rule = data.rules.find(r => r.country === country);
  return rule || null;
}


