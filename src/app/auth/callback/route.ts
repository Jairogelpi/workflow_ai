import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    console.log(`[Auth Callback] Processing code... (Relative Base: ${requestUrl.origin})`);

    if (code) {
        const cookieStore = await cookies()

        // Robustly determine the origin for the redirect
        // Priority:
        // 1. NEXT_PUBLIC_SITE_URL (Explicit override)
        // 2. VERCEL_URL (Vercel support)
        // 3. x-forwarded-host (Standard proxy header)
        // 4. host (Fallback)
        // 5. request.nextUrl.origin (Last resort)
        const forwardedHost = request.headers.get('x-forwarded-host')
        const host = request.headers.get('host')
        const envUrl = process.env.NEXT_PUBLIC_SITE_URL

        console.error(`[Auth Callback] Headers: host=${host}, x-forwarded-host=${forwardedHost}, x-forwarded-proto=${request.headers.get('x-forwarded-proto')}`);

        let origin = requestUrl.origin; // Default to internal if nothing else found

        // FORCE HTTPS in Production
        if (process.env.NODE_ENV === 'production') {
            console.error('[Auth Callback] Production Mode Detected - Forcing HTTPS Origin');
            origin = 'https://workgraph-os.onrender.com';
        } else if (envUrl) {
            origin = envUrl;
        } else if (process.env.VERCEL_URL) {
            origin = `https://${process.env.VERCEL_URL}`;
        } else if (forwardedHost) {
            origin = `https://${forwardedHost}`;
        } else if (host && !host.includes('localhost')) {
            origin = `https://${host}`;
        }

        console.error(`[Auth Callback] Resolved Origin: ${origin} (Internal: ${requestUrl.origin})`);

        // Use the resolved origin for the redirect
        const redirectUrl = new URL(next, origin);
        console.error(`[Auth Callback] Redirecting to: ${redirectUrl.toString()}`);
        const response = NextResponse.redirect(redirectUrl)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // FORCE Secure in Production
                        const isProduction = process.env.NODE_ENV === 'production';
                        const isSecure = isProduction ||
                            requestUrl.protocol === 'https:' ||
                            request.headers.get('x-forwarded-proto') === 'https';

                        console.error(`[Auth Callback] Setting Cookie: ${name}`);
                        console.error(`[Auth Callback] Security Check (STRICT): production=${isProduction} -> isSecure=${isSecure}`);

                        const cookieOptions = {
                            ...options,
                            path: '/',
                            sameSite: 'none' as const,
                            secure: true,
                            maxAge: 60 * 60 * 24 * 7, // 1 week
                        };
                        console.log(`[Auth Callback] Final Cookie Options:`, JSON.stringify(cookieOptions));

                        // cookieStore.set({ name, value, ...cookieOptions }) // REMOVED: Cannot set cookies on request store in GET handler
                        response.cookies.set({ name, value, ...cookieOptions })
                    },
                    remove(name: string, options: CookieOptions) {
                        const cookieOptions = {
                            ...options,
                            path: '/',
                            maxAge: 0
                        };
                        // cookieStore.set({ name, value: '', ...cookieOptions }) // REMOVED
                        response.cookies.set({ name, value: '', ...cookieOptions })
                    },
                },
            }
        )

        // Set a debug cookie to test persistence independent of Supabase
        response.cookies.set('debug-persistence', 'alive', { path: '/', secure: true, sameSite: 'none' });

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) {
                console.error('[Auth Callback] exchangeCodeForSession ERROR:', error);
                throw error;
            }

            console.log(`[Auth Callback] Session created for: ${data.user?.email}`);
            console.log(`[Auth Callback] Access Token Length: ${data.session?.access_token?.length}`);

            return response
        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            // Redirect to home with an error flag
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, request.url))
        }
    }

    // No code, redirect to home
    console.warn('[Auth Callback] No code found in URL');
    return NextResponse.redirect(new URL(next, request.url))
}
