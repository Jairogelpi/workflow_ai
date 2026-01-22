import { createClient } from '@supabase/supabase-js';

// Environment variables are injected by Vite during build
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[WorkGraph] Supabase credentials missing in extension environment.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
