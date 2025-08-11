import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type CountryCode = 'JP' | 'UK' | 'DE' | 'DK' | 'FI' | 'NO' | 'AT' | 'PL' | 'HU';

export interface RemoteCountryRule {
  country: CountryCode | string;
  effectiveFrom?: string; // ISO date
  taxAnnual?: number; // annual safe threshold for tax/benefit logic
  healthDependentAnnual?: number; // health insurance dependent threshold (if applicable)
  socialMonthly?: number; // monthly threshold (e.g., Minijob/Geringfügigkeit)
  currency?: string; // ISO 4217
  labels?: Record<string, string>; // UI labels
  sources?: string[]; // Official references
  updatedAt?: string; // ISO timestamp of this rule
}

interface RemoteRulesPayload {
  updatedAt?: string; // ISO timestamp of the dataset
  rules: RemoteCountryRule[];
}

const router = Router();

// In-memory cache with TTL
let cached: { payload: RemoteRulesPayload; etag: string; fetchedAt: number } | null = null;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (frontend may refresh weekly)

function computeEtag(json: string): string {
  return 'W/"' + crypto.createHash('sha1').update(json).digest('hex') + '"';
}

async function fetchRemote(): Promise<RemoteRulesPayload | null> {
  const url = process.env.RULES_REMOTE_URL || '';
  if (!url) return null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const payload = (await resp.json()) as RemoteRulesPayload;
    return payload;
  } catch {
    return null;
  }
}

function loadLocal(): RemoteRulesPayload | null {
  try {
    const filePath = path.join(process.cwd(), 'backend', 'src', 'data', 'country-rules.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(raw) as RemoteRulesPayload;
    return payload;
  } catch {
    return null;
  }
}

async function getRulesPayload(forceRefresh = false): Promise<RemoteRulesPayload> {
  const now = Date.now();
  if (!forceRefresh && cached && now - cached.fetchedAt < TTL_MS) {
    return cached.payload;
  }

  // Try remote first
  const remote = await fetchRemote();
  const payload = remote || loadLocal() || { updatedAt: new Date().toISOString(), rules: [] };
  const json = JSON.stringify(payload);
  cached = { payload, etag: computeEtag(json), fetchedAt: now };
  return payload;
}

// Exported helpers for app-level scheduling/warmup
export async function warmUpRulesCache(): Promise<void> {
  await getRulesPayload(false);
}

export function startRulesAutoRefresh(): void {
  const enabled = process.env.RULES_AUTO_REFRESH === 'true';
  if (!enabled) return;
  const hours = Number(process.env.RULES_REFRESH_INTERVAL_HOURS || '24');
  const intervalMs = Math.max(1, hours) * 60 * 60 * 1000;
  // Initial warm-up
  void getRulesPayload(false);
  setInterval(() => {
    void getRulesPayload(true);
  }, intervalMs);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const payload = await getRulesPayload(false);
    const json = JSON.stringify(payload);
    const etag = cached?.etag || computeEtag(json);

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('ETag', etag);
    res.status(200).send(json);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to load country rules' } });
  }
});

// Optional: force refresh endpoint (protect behind env flag in production)
router.post('/refresh', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RULES_REFRESH !== 'true') {
    return res.status(403).json({ success: false, error: { message: 'Refresh not allowed' } });
  }
  try {
    await getRulesPayload(true);
    res.json({ success: true, updatedAt: cached?.payload.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Refresh failed' } });
  }
});

export default router;


