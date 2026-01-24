import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    // Define production origin
    const origin = process.env.NODE_ENV === 'production'
        ? 'https://workgraph-os.onrender.com'
        : requestUrl.origin;

    console.log(`[Auth Callback] Processing callback. Code: ${code ? 'YES' : 'NO'}, Origin: ${origin}`);

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) {
                console.error('[Auth Callback] exchangeCodeForSession ERROR:', error.message);
                throw error;
            }

            console.log(`[Auth Callback] SUCCESS: Session for ${data.user?.email}`);

            // In Next.js 15, we handle cookies on the cookie store directly.
            // The cookies set in `setAll` will be included in the redirect response automatically.
            return NextResponse.redirect(new URL(next, origin))
        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin))
        }
    }

    console.warn('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL(next, origin))
}
