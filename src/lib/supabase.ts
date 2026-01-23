import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side client for client-side components and Zustand stores.
 * This is the main export for client components.
 */
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get the browser-side Supabase client.
 * Returns the same singleton instance.
 */
export const createClient = () => supabase;

// Legacy export for compatibility
export { supabase as default };

