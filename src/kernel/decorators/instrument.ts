import { traceSpan } from '../observability';

/**
 * Universal Observability Decorator
 * 
 * Apply this to any class method to automatically instrument it with OpenTelemetry spans.
 * Captures arguments, result (success/failure), and timing.
 * 
 * Usage:
 * class MyService {
 *   @Instrument()
 *   async myMethod(arg: string) { ... }
 * }
 */
export function Instrument(name?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const spanName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            return traceSpan(spanName, { args: JSON.stringify(args).slice(0, 100) }, async () => {
                try {
                    const result = await originalMethod.apply(this, args);
                    return result;
                } catch (error) {
                    throw error;
                }
            });
        };

        return descriptor;
    };
}
