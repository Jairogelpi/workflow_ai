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

        // Use the request's own origin for the redirect to ensure domain consistency
        const response = NextResponse.redirect(new URL(next, request.url))

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
                        const cookieOptions = {
                            ...options,
                            path: '/',
                            sameSite: 'lax' as const,
                            secure: requestUrl.protocol === 'https:',
                        };
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
