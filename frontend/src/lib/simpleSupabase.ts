// 🔐 シンプルSupabase認証クライアント - 統合版
// メインのSupabaseクライアントを再利用してGoTrueClientの重複を回避
import { supabase } from './supabaseClient';

// 既存のクライアントを再利用（統合）
export const simpleSupabase = supabase;

// デバッグ用
console.log('🔧 Simple Supabase using unified client');

export default simpleSupabase;