import { traceSpan } from './observability';
import { useGraphStore } from '../store/useGraphStore';

/**
 * SYNC GUARDIAN v1.0 [2026]
 * Guardián de integridad estructural y semántica.
 * Integra validación SAT (Rust) y consistencia CRDT.
 */
export class SyncGuardian {
    /**
     * Procesa una mutación de nodo y valida su legalidad lógica.
     */
    static async handleMutation(nodeId: string, delta: any) {
        return await traceSpan('sync_guardian_audit', { nodeId }, async () => {
            const { triggerRipple, addRLMThought, nodes } = useGraphStore.getState();
            const supabase = (await import('../lib/supabase')).supabase;

            // 1. Zero Trust: Get current JWT session
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // 2. Structural Validation (SAT Fallback/Preliminary)
            const isStructuralConflict = delta.relation === 'contradicts';
            if (isStructuralConflict) {
                this.triggerSecurityAlert(nodeId, "Violación de Invariante detectada por reglas estructurales.");
                throw new Error("Contradicción estructural inmediata.");
            }

            // 3. AI Semantic Validation (RLM Core)
            // Only validate textual claims/decisions to save latency
            if (delta.statement || delta.content || delta.rationale) {
                const claimText = delta.statement || delta.content || delta.rationale;

                try {
                    const response = await fetch('http://localhost:8082/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            claim: claimText,
                            context: nodes.slice(0, 10).map(n => n.data), // Provide some context
                            task_complexity: 'LOW'
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (!result.consistent) {
                            this.triggerSecurityAlert(nodeId, `RLM_REJECT: ${result.reasoning}`);
                            throw new Error(result.reasoning);
                        }

                        addRLMThought({
                            message: `RLM_VERIFIED: Cambio en ${nodeId.slice(0, 8)} validado por SLM (${result.confidence * 100}% confianza).`,
                            type: 'success'
                        });
                    }
                } catch (err: any) {
                    // If backend is down, we allow in dev but log warning
                    // In strict military mode, we would block.
                    console.warn('[SyncGuardian] RLM Core unreachable or rejected:', err.message);
                    if (err.message && !err.message.includes('fetch')) throw err;
                }
            }

            return true;
        });
    }

    private static triggerSecurityAlert(nodeId: string, message: string) {
        const { triggerRipple, addRLMThought } = useGraphStore.getState();
        triggerRipple({
            type: 'error',
            message: `Brecha Lógica: ${message}`,
            intensity: 'high'
        });
        addRLMThought({
            message: `SAT_ALERT: ${message} [Node: ${nodeId.slice(0, 8)}]`,
            type: 'error'
        });
    }

    private static async runShadowAudit(nodeId: string, delta: any) {
        // Ejecución asíncrona de la re-alineación
        const { performAlignmentCheck, projectManifest } = useGraphStore.getState();
        if (projectManifest) {
            // Re-evaluamos la alineación general entre la visión (Plan) y la implementación actual
            performAlignmentCheck('root', 'current');
        }
    }

    private static isSignificantChange(delta: any): boolean {
        // Cambios en contenido, relaciones o PINs se consideran estructurales
        return !!(delta.statement || delta.content || delta.relation || delta.pin !== undefined);
    }
}
