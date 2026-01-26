export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./kernel/observability').then(mod => {
            // Here we could initialize the real OpenTelemetry SDK
            // For now, we ensure the observability module is loaded
            console.log('[Instrumentation] Node.js runtime registered.');
        });
    }
}
