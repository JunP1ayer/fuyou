// 🔐 シンプルSupabase認証クライアント
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が不足: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// シンプルなSupabaseクライアント
export const simpleSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // メール確認後の自動ログインを有効化
    storageKey: 'simple-fuyou-auth',
  },
  global: {
    headers: {
      'x-my-custom-header': 'fuyou-app',
    }
  }
});

// デバッグ用
console.log('🔧 Simple Supabase initialized:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey,
});

export default simpleSupabase;