import { useGraphStore } from '../store/useGraphStore';
import { WorkNode } from '../canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utilitarios de planificación de bajo nivel para el Kernel.
 * Estos interactúan directamente con el store para realizar cambios estructurales.
 */

export async function createBranch(projectId: string, name: string): Promise<string> {
    const { addNode } = useGraphStore.getState();
    const branchId = uuidv4();

    await addNode({
        id: branchId as any,
        type: 'idea',
        summary: name,
        metadata: {
            origin: 'ai',
            confidence: 1.0,
            validated: true,
            pin: true,
            tags: ['branch', 'scaffold']
        }
    } as any);

    return branchId;
}

export async function insertNodes(projectId: string, parentId: string, nodes: any[]): Promise<void> {
    const { addNode } = useGraphStore.getState();

    for (const nodeData of nodes) {
        // En un entorno real, aquí se calcularía la posición vectorial usando physics
        const position = {
            x: Math.random() * 800 - 400,
            y: Math.random() * 800 - 400
        };

        // El store maneja la persistencia y el versionado
        await addNode({
            ...nodeData,
            metadata: {
                ...nodeData.metadata,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        } as any, position);
    }
}
