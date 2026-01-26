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
                                    httpOnly: false,
                                    domain: undefined,
                                };

                                // 1. Collect for Client-Side Injection
                                // RE-ENABLE ENCODING: Raw Base64 can break document.cookie syntax (e.g. '=')
                                // Supabase chunks are sized to fit significantly below 4096 to allow for encoding overhead.
                                cookiesToInject.push({ name, value: encodeURIComponent(value), options: finalOptions });

                                // 2. Server-Side Header (Backup)
                                let cookieString = `${name}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=None`;
                                if (finalOptions.maxAge) cookieString += `; Max-Age=${finalOptions.maxAge}`;

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


            // MANUAL FALLBACK: If Supabase didn't trigger setAll, we do it ourselves.
            if (cookiesToInject.length === 0 && data.session) {

                try {
                    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                    const projectRef = projectUrl.match(/https?:\/\/([^.]+)\./)?.[1];

                    if (projectRef) {
                        const baseName = `sb-${projectRef}-auth-token`;
                        // Serialize session safely
                        const sessionStr = JSON.stringify(data.session);
                        // Prefix properly as Supabase does
                        const rawValue = 'base64-' + Buffer.from(sessionStr).toString('base64');

                        // CHUNKING LOGIC (Max 3000 chars to be safe < 4096 bytes)
                        const CHUNK_SIZE = 3000;
                        const chunks: string[] = [];

                        for (let i = 0; i < rawValue.length; i += CHUNK_SIZE) {
                            chunks.push(rawValue.slice(i, i + CHUNK_SIZE));
                        }


                        chunks.forEach((chunk, index) => {
                            const name = `${baseName}.${index}`;
                            cookiesToInject.push({
                                name,
                                value: chunk,
                                options: {
                                    path: '/',
                                    secure: true,
                                    sameSite: 'none',
                                    maxAge: 60 * 60 * 24 * 7 // 1 week
                                }
                            });
                        });

                        // Add legacy single token ONLY if small (unlikely)
                        if (chunks.length === 1) {
                            cookiesToInject.push({
                                name: baseName, // Un-chunked alias
                                value: chunks[0]!,
                                options: { path: '/', secure: true, sameSite: 'none', maxAge: 60 * 60 * 24 * 7 }
                            });
                        }

                        // Fallback access token for simple middleware
                        cookiesToInject.push({
                            name: 'sb-access-token',
                            value: data.session.access_token,
                            options: { path: '/', secure: true, sameSite: 'none', maxAge: 3600 }
                        });
                    }
                } catch (e) {
                    console.error('[Auth Callback] Manual fallback failed:', e);
                }
            }

            // HYDRATION SCRIPT
            const cookieScript = JSON.stringify(cookiesToInject);
            const redirectUrl = new URL(next, origin).toString();

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting...</title>
                <style>
                    body { 
                        font-family: system-ui, -apple-system, sans-serif; 
                        background: #000; 
                        color: #fff; 
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        margin: 0;
                    }
                    .loader {
                        width: 48px;
                        height: 48px;
                        border: 3px solid #fff;
                        border-bottom-color: transparent;
                        border-radius: 50%;
                        display: inline-block;
                        box-sizing: border-box;
                        animation: rotation 1s linear infinite;
                        margin-bottom: 1.5rem;
                    }
                    @keyframes rotation {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    h1 { font-size: 1rem; font-weight: 400; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <span class="loader"></span>
                <h1>Initializing Session...</h1>
                
                <script>
                    const cookies = ${cookieScript};
                    
                    try {
                        cookies.forEach(c => {
                            // Write Encoded Cookie
                            let cookieStr = c.name + '=' + encodeURIComponent(c.value) + '; Path=/; Secure; SameSite=None';
                            if (c.options.maxAge) cookieStr += '; Max-Age=' + c.options.maxAge;
                            document.cookie = cookieStr;
                        });

                        // Immediate redirect on success
                        window.location.href = "${redirectUrl}";
                    } catch (e) {
                        console.error('Hydration failed:', e);
                        // Fallback redirect anyway, maybe middleware catches it
                        window.location.href = "${redirectUrl}";
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
