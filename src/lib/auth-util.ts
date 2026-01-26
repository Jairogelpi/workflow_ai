import { createClient } from './supabase-server';

/**
 * Retrieves the current session JWT from Supabase on the server side.
 */
export async function getServerJWT(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('[AuthUtil] Failed to get server JWT:', error);
        return null;
    }
}
