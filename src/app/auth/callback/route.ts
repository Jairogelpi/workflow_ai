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

        // Create the response object FIRST so we can attach cookies to it in setAll
        const response = NextResponse.redirect(new URL(next, origin))

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
                            cookiesToSet.forEach(({ name, value, options }) => {
                                console.log(`[Auth Callback] setAll: setting cookie ${name}`);
                                // Set on the cookie store for immediate server-side context
                                cookieStore.set(name, value, options)
                                // Set on the response for the browser to receive it
                                response.cookies.set(name, value, options)
                            })
                        } catch (err) {
                            console.error('[Auth Callback] setAll ERROR:', err);
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

            // Return the response which now has the cookies attached via setAll
            return response
        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin))
        }
    }

    console.warn('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL(next, origin))
}
