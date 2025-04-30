import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export type User = {
  id: number;
  email: string;
  role: 'user' | 'dev';
};

export type Model = {
  id: number;
  model_name: string;
  image_target: string;
  model_file_url: string;
  description: string;
  uploaded_by: number;
  created_at: string;
};
