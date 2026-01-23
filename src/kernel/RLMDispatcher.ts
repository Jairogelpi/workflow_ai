import { traceSpan } from './observability';
import { createBranch, insertNodes } from './planner';
import { RLMCompiler } from './RLMCompiler';

/**
 * RLM DISPATCHER v2.0 [2026]
 * Orquestador de enjambre para la autogeneración de arquitecturas de pensamiento.
 */
export class RLMDispatcher {
    /**
     * Toma el manifiesto de un proyecto y lo descompone en un sistema vivo.
     */
    static async dispatch(projectId: string, prompt: string) {
        return await traceSpan('rlm_dispatch', { projectId }, async () => {
            console.log(`[RLM] Iniciando descomposición para el proyecto: ${projectId}`);

            // 1. Fase de Compilación Semántica
            const architecture = await RLMCompiler.compile(prompt);

            for (const pillar of architecture.pillars) {
                // 2. Creación de Ramas (Puntos de anclaje)
                // Usando la utilidad del kernel planner
                const branchId = await createBranch(projectId, pillar.name);

                // 3. Generación de Nodos de Pensamiento
                const nodesToInsert = pillar.concepts.map((concept: any) => ({
                    type: concept.type,
                    statement: concept.text, // Mapping logic for different node types happens in insertNodes
                    metadata: {
                        origin: 'rlm-swarm',
                        confidence: 0.95,
                        pin: pillar.isCritical
                    }
                }));

                await insertNodes(projectId, branchId, nodesToInsert);

                console.log(`[RLM] Rama '${pillar.name}' materializada con ${nodesToInsert.length} nodos.`);
            }

            // [Hito 7.8] Post-Generation SAT validation would be triggered here
            return { status: 'COMPLETED', coverage: 1.0 };
        });
    }
}
