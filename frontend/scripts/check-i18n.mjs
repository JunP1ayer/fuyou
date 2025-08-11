#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const localesDir = path.resolve(process.cwd(), 'src', 'locales');
/* eslint-disable no-undef */
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('No locale files found in src/locales');
  process.exit(1);
}

/**
 * Flattens nested JSON keys into dot.notation
 */
function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const localeKeyMap = new Map();
let unionKeys = new Set();

for (const file of files) {
  const full = path.join(localesDir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const flat = flatten(json);
  localeKeyMap.set(file, new Set(Object.keys(flat)));
  unionKeys = new Set([...unionKeys, ...Object.keys(flat)]);
}

let missingCount = 0; // kept for future aggregate reporting
const report = [];

for (const [file, keySet] of localeKeyMap.entries()) {
  const missing = [...unionKeys].filter(k => !keySet.has(k));
  if (missing.length > 0) {
    missingCount += missing.length;
    report.push({ file, missing });
  }
}

if (report.length > 0) {
  console.error('Missing i18n keys detected:');
  for (const { file, missing } of report) {
    console.error(`\n- ${file}: ${missing.length} keys missing`);
    for (const k of missing) console.error(`  • ${k}`);
  }
  process.exit(2);
}

console.log('All locale files contain a complete key set. ✅');

