import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing required Supabase environment variables');
  process.exit(1);
}

// Client for user-authenticated requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service-level operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types (to be expanded based on actual schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          is_student: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          is_student?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          is_student?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          description: string | null;
          income_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source: string;
          description?: string | null;
          income_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source?: string;
          description?: string | null;
          income_date?: string;
          created_at?: string;
        };
      };
      dependents: {
        Row: {
          id: string;
          user_id: string;
          annual_limit: number;
          current_year: number;
          alert_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          annual_limit?: number;
          current_year: number;
          alert_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          annual_limit?: number;
          current_year?: number;
          alert_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Income = Database['public']['Tables']['incomes']['Row'];
export type Dependent = Database['public']['Tables']['dependents']['Row'];

export default supabase;