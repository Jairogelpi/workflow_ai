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
        const responseHeaders = new Headers();

        responseHeaders.append('Set-Cookie', 'test-canary=alive; Path=/; Secure; SameSite=None');
        responseHeaders.append('Content-Type', 'text/html'); // Success Page

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
                                    sameSite: 'none' as const,
                                    httpOnly: false,
                                    domain: undefined,
                                };

                                // Re-enable encoding for standard compliance
                                let cookieString = `${name}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=None`;
                                if (finalOptions.maxAge) {
                                    cookieString += `; Max-Age=${finalOptions.maxAge}`;
                                }

                                console.log(`[Auth Callback] Appending Header: ${name} (len: ${value.length})`);
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

            // HTML Success Page to verify cookies and detach redirect loop
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Successful</title>
                <meta http-equiv="refresh" content="3;url=${new URL(next, origin).toString()}" />
                <style>
                    body { font-family: system-ui, sans-serif; padding: 2rem; background: #111; color: #eee; }
                    .box { background: #222; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
                    code { color: #4af; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1>Login Successful</h1>
                <p>Redirecting to dashboard in 3 seconds...</p>
                <div class="box">
                    <h3>Debug Info:</h3>
                    <p>Current Cookies (JS accessible):</p>
                    <code id="cookies">Loading...</code>
                </div>
                <script>
                    document.getElementById('cookies').textContent = document.cookie || '(none)';
                    console.log('Cookies:', document.cookie);
                </script>
            </body>
            </html>
            `;

            return new Response(html, {
                status: 200,
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
