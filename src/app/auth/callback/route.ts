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
        const cookiesToInject: { name: string, value: string, options: any }[] = [];

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
                                    sameSite: 'none',
                                };

                                // Clean up value
                                const safeValue = encodeURIComponent(value);

                                // 1. Collect for Client-Side Injection (The Bypass)
                                cookiesToInject.push({ name, value: safeValue, options: finalOptions });

                                // 2. Also try Server-Side Header (Backup)
                                let cookieString = `${name}=${safeValue}; Path=/; Secure; SameSite=None`;
                                if (finalOptions.maxAge) cookieString += `; Max-Age=${finalOptions.maxAge}`;

                                console.log(`[Auth Callback] Processing Cookie: ${name}`);
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

            // HYDRATION SCRIPT: Writes cookies directly in the browser
            const cookieScript = JSON.stringify(cookiesToInject);
            const redirectUrl = new URL(next, origin).toString();

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Successful</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 2rem; background: #111; color: #eee; }
                    .box { background: #222; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #333; }
                    code { color: #4af; word-break: break-all; display: block; margin-top: 0.5rem; }
                    .success { color: #4fa; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Login Successful</h1>
                <p>Hydrating session...</p>
                <div class="box">
                    <h3>Client-Side Cookie Injection</h3>
                    <div id="logs"></div>
                </div>
                <script>
                    const cookies = ${cookieScript};
                    const logs = document.getElementById('logs');
                    
                    function log(msg) {
                        const div = document.createElement('div');
                        div.textContent = '> ' + msg;
                        logs.appendChild(div);
                    }

                    try {
                        cookies.forEach(c => {
                            // Construct cookie string manually for JS
                            let cookieStr = c.name + '=' + c.value + '; Path=/; Secure; SameSite=None';
                            if (c.options.maxAge) cookieStr += '; Max-Age=' + c.options.maxAge;
                            
                            document.cookie = cookieStr;
                            log('Wrote: ' + c.name);
                        });

                        log('All cookies written.');
                        
                        setTimeout(() => {
                            window.location.href = "${redirectUrl}";
                        }, 1500); // 1.5s delay to assure write
                    } catch (e) {
                        log('ERROR: ' + e.message);
                    }
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
