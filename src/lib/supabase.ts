import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Function to check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  // For now, checking based on a role column in the profiles table
  // You would need to add an 'is_admin' column to your profiles table in Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  // If profile has is_admin field, return its value, otherwise default to false
  return profile?.is_admin || false;
};
