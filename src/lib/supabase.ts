import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side client creator for API Routes and Server Actions.
 * Handles cookies automatically.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // This can be ignored if called from a Server Component
                }
            },
        },
    });
}

/**
 * Basic client for non-authenticated or background tasks.
 */
export const supabaseAdmin = createSupabaseClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// Legacy exports for compatibility during refactor
export const createClientFactory = createClient;
export { createClient as createServerClient };

