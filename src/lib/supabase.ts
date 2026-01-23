import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side client for client-side components and Zustand stores.
 * Uses @supabase/ssr to ensure cookies are shared with the server actions.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get the browser-side Supabase client.
 * Returns the same singleton instance.
 */
export const createClient = () => supabase;

// Legacy export for compatibility
export { supabase as default };

