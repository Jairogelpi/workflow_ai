import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    // Use configured site URL, or hardcoded production URL if env is missing.
    let siteUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!siteUrl) {
        siteUrl = origin.includes('localhost') ? 'http://localhost:3000' : 'https://workgraph-os.onrender.com';
    }

    if (code) {
        console.log(`[Auth Callback] Code received. Exchange initiating...`);
        const cookieStore = await cookies()

        // We create the response FIRST so we can attach cookies to it
        const response = NextResponse.redirect(`${siteUrl}${next}`)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Attach to both the store and the response to be safe
                        cookieStore.set({ name, value, ...options })
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                        response.cookies.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            console.log(`[Auth Callback] Session exchange successful for: ${data.user?.email}`);
            return response
        } else {
            console.error('[Auth Callback] Session exchange error:', error.message);
        }
    }

    return NextResponse.redirect(`${siteUrl}/auth/auth-code-error`)
}

