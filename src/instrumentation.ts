export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // [ANTIGRAVITY] Observability Phase 2: Real Instrumentation
        // We dynamic import to avoid bundling OTel in the Edge or Client runtime by mistake
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { Resource } = await import('@opentelemetry/resources');
        const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');
        const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-node');
        const { SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-base');

        const sdk = new NodeSDK({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: 'antigravity-kernel',
                [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
            }),
            // For now, we dump traces to console to prove it works ("Visible Observability")
            traceExporter: new ConsoleSpanExporter(),
            // Simple processor for immediate output (useful for dev/debugging)
            spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
        });

        sdk.start();

        console.log('[Instrumentation] 🔭 OpenTelemetry SDK Started (Node.js Runtime)');
    }
}
