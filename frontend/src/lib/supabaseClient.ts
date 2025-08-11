// Centralized Supabase client singleton
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast with clear guidance
  // Note: Keep message concise to avoid leaking secrets in logs
  throw new Error(
    'Supabase環境変数が不足しています。VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。'
  );
}

// Avoid multiple instances in HMR by hoisting to globalThis
// and use a custom storageKey to prevent collisions across environments
const globalKey = '__fuyou_supabase__';
const existing = (globalThis as any)[globalKey];

export const supabase = existing ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Explicit storageKey for clarity and to avoid clashes
    storageKey: 'fuyou-auth',
    storage: localStorage,
  },
});

if (!existing) {
  (globalThis as any)[globalKey] = supabase;
}

export default supabase;


