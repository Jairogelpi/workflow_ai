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

        // Create the response object manually to ensure mutable headers
        // NextResponse.redirect() can sometimes be immutable or inconsistent with cookies in Route Handlers
        const response = new NextResponse(null, {
            status: 303, // See Other - Standard for POST/Redirect patterns
            headers: {
                Location: new URL(next, origin).toString(),
            },
        });

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
                                    sameSite: 'lax' as const,
                                    httpOnly: false,
                                    domain: undefined,
                                };

                                console.log(`[Auth Callback] setAll: setting cookie ${name}`);

                                // 1. Set on cookie store (server context)
                                cookieStore.set(name, value, finalOptions);

                                // 2. Set on response object (standard method)
                                response.cookies.set(name, value, finalOptions);

                                // 3. MANUALLY Append via header to guarantee it persists
                                // Format: Name=Value; Path=/; Secure; SameSite=Lax
                                let cookieString = `${name}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Lax`;
                                if (finalOptions.maxAge) {
                                    cookieString += `; Max-Age=${finalOptions.maxAge}`;
                                }
                                // Note: We don't include Domain (undefined) or HttpOnly (false)

                                console.log(`[Auth Callback] Manually appending header: ${cookieString.substring(0, 50)}...`);
                                response.headers.append('Set-Cookie', cookieString);
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

            // Inspect the headers before returning
            // Note: In some Next.js environments, we might need to use getSetCookie() if available, or just check headers
            const setCookieHeader = response.headers.get('set-cookie');
            console.log('[Auth Callback] Response Set-Cookie Header (First):', setCookieHeader);

            // Try to see if there are multiple
            try {
                // @ts-ignore
                const allCookies = response.headers.getSetCookie();
                console.log('[Auth Callback] All Set-Cookie Headers:', JSON.stringify(allCookies, null, 2));
            } catch (e) {
                console.log('[Auth Callback] getSetCookie not available');
            }

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
