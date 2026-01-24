import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    console.error(`[Auth Callback] URL Origin: ${requestUrl.origin}`);

    if (code) {
        console.error(`[Auth Callback] Code received: ${code.substring(0, 10)}...`);
        const cookieStore = await cookies()

        // Define production origin
        const origin = process.env.NODE_ENV === 'production'
            ? 'https://workgraph-os.onrender.com'
            : requestUrl.origin;

        const redirectUrl = new URL(next, origin);
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
                        const isProduction = process.env.NODE_ENV === 'production';
                        const isSecure = isProduction ||
                            requestUrl.protocol === 'https:' ||
                            request.headers.get('x-forwarded-proto') === 'https';

                        const cookieOptions = {
                            path: '/',
                            secure: isSecure,
                            sameSite: 'lax' as const,
                            httpOnly: false, // Must be false for Supabase client-side SDK to see the session
                            maxAge: 60 * 60 * 24 * 7,
                        };

                        console.error(`[Auth Callback] SET Cookie: ${name} (Secure: ${isSecure}, len: ${value.length})`);

                        // Set on the async cookie store (Next.js 15 standard)
                        cookieStore.set({ name, value, ...cookieOptions })
                        // Also set on response for the immediate redirect
                        response.cookies.set({ name, value, ...cookieOptions })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', path: '/', maxAge: 0 })
                        response.cookies.set({ name, value: '', path: '/', maxAge: 0 })
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

            console.error(`[Auth Callback] SUCCESS: Session for ${data.user?.email}`);
            return response
        } catch (error: any) {
            console.error('[Auth Callback] CRITICAL ERROR:', error.message);
            return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin))
        }
    }

    console.warn('[Auth Callback] No code provided');
    return NextResponse.redirect(new URL(next, requestUrl.origin))
}
