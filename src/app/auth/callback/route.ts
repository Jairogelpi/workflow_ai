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

        // Prepare headers container for the final response
        const responseHeaders = new Headers();

        // 0. Canary Cookie
        responseHeaders.append('Set-Cookie', 'test-canary=alive; Path=/; Secure; SameSite=None');

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
                                const finalOptions = {
                                    ...options,
                                    path: '/',
                                    secure: true,
                                    sameSite: 'none' as const, // RELAXED for debugging
                                    httpOnly: false,
                                    domain: undefined,
                                };

                                // MANUALLY Append via header to guarantee persistence
                                // We do NOT touch cookieStore here to avoid side-effects
                                let cookieString = `${name}=${value}; Path=/; Secure; SameSite=None`;
                                if (finalOptions.maxAge) {
                                    cookieString += `; Max-Age=${finalOptions.maxAge}`;
                                }

                                console.log(`[Auth Callback] Appending Header: ${cookieString.substring(0, 50)}...`);
                                responseHeaders.append('Set-Cookie', cookieString);
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

            // Set Location for redirect
            responseHeaders.set('Location', new URL(next, origin).toString());

            // Return standard web Response with status 303 (See Other)
            return new Response(null, {
                status: 303,
                headers: responseHeaders,
            });

        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin))
        }
    }

    console.warn('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL(next, origin))
}
