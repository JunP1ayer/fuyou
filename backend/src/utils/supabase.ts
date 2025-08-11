import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'test') {
    // Fallback for test environment to avoid process.exit
    logger.warn('Supabase env not set in test; using dummy values');
    supabaseUrl = 'http://localhost';
    supabaseAnonKey = 'test-key';
  } else {
    logger.error('Missing required Supabase environment variables');
    process.exit(1);
  }
}

// Client for user-authenticated requests
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for service-level operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl!,
  supabaseServiceKey || supabaseAnonKey!,
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
          transaction_id?: string | null;
          metadata?: { confidence?: number } | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source: string;
          description?: string | null;
          income_date: string;
          created_at?: string;
          transaction_id?: string | null;
          metadata?: { confidence?: number } | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source?: string;
          description?: string | null;
          income_date?: string;
          created_at?: string;
          transaction_id?: string | null;
          metadata?: { confidence?: number } | null;
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
      shifts: {
        Row: {
          id: string;
          user_id: string;
          job_source_id: string | null;
          job_source_name: string;
          date: string;
          start_time: string;
          end_time: string;
          hourly_rate: number;
          break_minutes: number;
          working_hours: string; // stored as text in DB
          calculated_earnings: string; // stored as text in DB
          description: string | null;
          is_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['shifts']['Row']>;
        Update: Partial<Database['public']['Tables']['shifts']['Row']>;
      };
      job_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          hourly_rate?: number | null;
          expected_monthly_hours?: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['job_sources']['Row']>;
        Update: Partial<Database['public']['Tables']['job_sources']['Row']>;
      };
      availability_slots: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          job_source_id: string | null;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['availability_slots']['Row']>;
        Update: Partial<Database['public']['Tables']['availability_slots']['Row']>;
      };
      user_optimization_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_objective: string;
          optimization_frequency: string;
          auto_apply_suggestions: boolean;
          notification_preferences: Record<string, unknown> | null;
          tier_level: string;
          monthly_optimization_runs: number | null;
          last_optimization_reset: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_optimization_preferences']['Row']>;
        Update: Partial<Database['public']['Tables']['user_optimization_preferences']['Row']>;
      };
      optimization_constraints: {
        Row: {
          id: string;
          user_id: string;
          constraint_type: string;
          constraint_value: number;
          constraint_unit: string;
          priority: number;
          is_active: boolean;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['optimization_constraints']['Row']>;
        Update: Partial<Database['public']['Tables']['optimization_constraints']['Row']>;
      };
      csv_uploads: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          bank_type: string;
          file_size: number;
          total_rows: number;
          processed_rows?: number | null;
          income_rows?: number | null;
          status: string;
          processing_time_ms?: number | null;
          average_confidence?: number | null;
          error_message?: string | null;
          completed_at?: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['csv_uploads']['Row']>;
        Update: Partial<Database['public']['Tables']['csv_uploads']['Row']>;
      };
      csv_processing_errors: {
        Row: {
          id: string;
          csv_upload_id: string;
          row_number: number;
          error_type: string;
          error_message: string;
          raw_row_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['csv_processing_errors']['Row']>;
        Update: Partial<Database['public']['Tables']['csv_processing_errors']['Row']>;
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          shift_filter_name: string | null;
          timezone: string;
          preferences: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Income = Database['public']['Tables']['incomes']['Row'];
export type Dependent = Database['public']['Tables']['dependents']['Row'];

export default supabase;