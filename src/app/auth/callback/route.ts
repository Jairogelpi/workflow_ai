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

        let origin = requestUrl.origin; // Default to internal if nothing else found

        if (process.env.NEXT_PUBLIC_SITE_URL) {
            origin = process.env.NEXT_PUBLIC_SITE_URL;
        } else if (process.env.VERCEL_URL) {
            origin = `https://${process.env.VERCEL_URL}`;
        } else if (forwardedHost) {
            origin = `https://${forwardedHost}`; // Assume HTTPS behind proxy
        } else if (host) {
            origin = `https://${host}`; // Assume HTTPS
        }

        console.log(`[Auth Callback] Resolved Origin: ${origin} (Internal: ${requestUrl.origin})`);

        // Use the resolved origin for the redirect
        const response = NextResponse.redirect(new URL(next, origin))

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Ensure the cookie is accessible across the entire site
                        // Check if we are running securely (HTTPS)
                        // Trust X-Forwarded-Proto if behind a proxy (like Render)
                        const isSecure = process.env.NODE_ENV === 'production' ||
                            requestUrl.protocol === 'https:' ||
                            request.headers.get('x-forwarded-proto') === 'https';

                        console.log(`[Auth Callback] Setting Cookie: ${name}`);
                        console.log(`[Auth Callback] Security Check: env=${process.env.NODE_ENV}, proto=${requestUrl.protocol}, x-forwarded=${request.headers.get('x-forwarded-proto')} -> isSecure=${isSecure}`);

                        const cookieOptions = {
                            ...options,
                            path: '/',
                            sameSite: 'lax' as const,
                            secure: isSecure,
                        };
                        console.log(`[Auth Callback] Final Cookie Options:`, JSON.stringify(cookieOptions));

                        cookieStore.set({ name, value, ...cookieOptions })
                        response.cookies.set({ name, value, ...cookieOptions })
                    },
                    remove(name: string, options: CookieOptions) {
                        const cookieOptions = {
                            ...options,
                            path: '/',
                            maxAge: 0
                        };
                        cookieStore.set({ name, value: '', ...cookieOptions })
                        response.cookies.set({ name, value: '', ...cookieOptions })
                    },
                },
            }
        )

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) throw error

            console.log(`[Auth Callback] Success for: ${data.user?.email}`);
            return response
        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            // Redirect to home with an error flag
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, request.url))
        }
    }

    // No code, redirect to home
    return NextResponse.redirect(new URL(next, request.url))
}
