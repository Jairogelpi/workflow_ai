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

            // MANUAL FALLBACK: If Supabase didn't trigger setAll, we do it ourselves.
            if (cookiesToInject.length === 0 && data.session) {
                console.warn('[Auth Callback] WARNING: setAll was not triggered. Manually constructing CHUNKED cookies.');

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

                        console.log(`[Auth Callback] Chunking session (len: ${rawValue.length}) into ${chunks.length} chunks.`);

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
                                value: chunks[0],
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
                <title>Login Successful</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 2rem; background: #111; color: #eee; }
                    .box { background: #222; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #333; }
                    .error { color: #f55; font-weight: bold; }
                    .success { color: #4fa; font-weight: bold; }
                    pre { background: #000; padding: 0.5rem; overflow-x: auto; color: #aaa; }
                </style>
            </head>
            <body>
                <h1>Login Successful</h1>
                <div id="status">Starting hydration...</div>
                
                <div class="box">
                    <h3>Server Payload (What the server sent)</h3>
                    <p>Found ${cookiesToInject.length} cookies to inject.</p>
                    <pre>${JSON.stringify(cookiesToInject.map(c => ({ name: c.name, len: c.value.length })), null, 2)}</pre>
                </div>

                <div class="box">
                    <h3>Hydration Log</h3>
                    <div id="logs"></div>
                </div>

                <div class="box">
                    <h3>Final Cookie Check</h3>
                    <pre id="final-cookies">...</pre>
                </div>

                <script>
                    const cookies = ${cookieScript};
                    const logs = document.getElementById('logs');
                    const status = document.getElementById('status');
                    
                    function log(msg, type = 'info') {
                        const div = document.createElement('div');
                        div.textContent = '> ' + msg;
                        if (type === 'error') div.style.color = '#f55';
                        logs.appendChild(div);
                    }

                    try {
                        let successCount = 0;
                        cookies.forEach(c => {
                            // Write Encoded Cookie
                            let cookieStr = c.name + '=' + encodeURIComponent(c.value) + '; Path=/; Secure; SameSite=None';
                            if (c.options.maxAge) cookieStr += '; Max-Age=' + c.options.maxAge;
                            
                            document.cookie = cookieStr;
                            log('Wrote: ' + c.name + ' (Len: ' + c.value.length + ')');
                        });

                        // VERIFICATION STEP
                        const allCookies = document.cookie;
                        document.getElementById('final-cookies').textContent = allCookies;
                        
                        // Verify we have at least one chunk or token
                        const hasToken = allCookies.includes('auth-token') || allCookies.includes('sb-access-token');
                        
                        // Strict check: Are ALL injected chunks present?
                        const failedCookies = cookies.filter(c => !allCookies.includes(c.name));
                        
                        if (failedCookies.length > 0) {
                            status.textContent = 'FATAL ERROR: Some cookies were rejected!';
                            status.className = 'error';
                            log('MISSING: ' + failedCookies.map(c => c.name).join(', '), 'error');
                        } else if (!hasToken) {
                            status.textContent = 'FATAL ERROR: No auth tokens visible!';
                            status.className = 'error';
                        } else {
                            status.textContent = 'Success! Redirecting...';
                            status.className = 'success';
                            log('Verification Passed. All chunks written. Redirecting...');
                            setTimeout(() => {
                                window.location.href = "${redirectUrl}";
                            }, 1000);
                        }

                    } catch (e) {
                        log('JS ERROR: ' + e.message, 'error');
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
