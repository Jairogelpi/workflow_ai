export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // [ANTIGRAVITY] Observability Phase 2: Real Instrumentation
        // Wrapped in try-catch to prevent server crash if OTel fails to load in standalone mode
        try {
            const { NodeSDK } = await import('@opentelemetry/sdk-node');
            const { Resource } = await import('@opentelemetry/resources');
            const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-node');
            const { SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-base');

            const sdk = new NodeSDK({
                resource: new Resource({
                    'service.name': 'antigravity-kernel',
                    'service.version': '0.1.0',
                }),
                traceExporter: new ConsoleSpanExporter(),
                spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
            });

            sdk.start();
            console.log('[Instrumentation] OpenTelemetry SDK Started (Node.js Runtime)');
        } catch (err) {
            // Graceful degradation: OTel is optional, server continues without tracing
            console.warn('[Instrumentation] OpenTelemetry unavailable:', err instanceof Error ? err.message : String(err));
        }
    }
}
