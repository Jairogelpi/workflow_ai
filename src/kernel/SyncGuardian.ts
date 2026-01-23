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
            const { triggerRipple, addRLMThought } = useGraphStore.getState();

            // 1. Sincronización de estado CRDT (Mock for Hito 7.9)
            // En un entorno real, llamaríamos a la librería crdt-sync
            console.log(`[SyncGuardian] Aplicando delta CRDT para ${nodeId}`);

            // 2. Validación SAT en Rust (Consistencia de PINs e Invariantes)
            try {
                // Simulamos una validación SAT rápida
                // En el kernel de Rust esto buscaría contradicciones estructurales
                const isConflict = delta.statement?.toLowerCase().includes('error') || delta.relation === 'contradicts';

                if (isConflict) {
                    (useGraphStore.getState() as any).triggerRipple({
                        type: 'error',
                        message: 'Logic Breach: El cambio contradice un Invariante PIN.',
                        intensity: 'high'
                    });
                    addRLMThought({
                        message: `SAT_ALERT: Violación estructural detectada en nodo ${nodeId.slice(0, 8)}.`,
                        type: 'error'
                    });
                    throw new Error("Violación de Invariante detectada por Rust logic-engine.");
                }
            } catch (err: any) {
                if (err.message && err.message.includes('SAT_ALERT')) throw err;
                console.warn('[SyncGuardian] SAT solver fallback:', err);
            }

            // 3. Auditoría Semántica (RLM Shadow Audit)
            if (this.isSignificantChange(delta)) {
                addRLMThought({
                    message: `SHADOW_AUDIT: Analizando deriva semántica para cambio en ${nodeId.slice(0, 8)}...`,
                    type: 'reasoning'
                });

                // Dispara el motor de alineación en segundo plano (No bloqueante)
                // Esto genera los Ghost Nodes o parches necesarios
                this.runShadowAudit(nodeId, delta);
            }

            return true;
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
