
import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/compiler/index';
import { WorkGraph, WorkNodeSchema } from '../src/canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';
import { createVersion } from '../src/kernel/versioning';

describe('RLM Compiler Pipeline (Hito 1.1)', () => {

    const createMockGraph = (): WorkGraph => {
        const note: any = {
            id: uuidv4(),
            type: 'note',
            content: 'Background Context',
            metadata: {
                origin: 'human',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: ''
            }
        };
        note.metadata = createVersion(note);

        return {
            nodes: { [note.id]: note },
            edges: {}
        };
    };

    it('should execute a Dry Run from Goal to Artifact', async () => {
        const graph = createMockGraph();
        const goal = 'Generate Monthly Report';

        const artifact = await runPipeline(goal, graph);

        // 1. Verify Output Structure
        expect(artifact).toBeDefined();
        expect(artifact.type).toBe('artifact');

        // 2. Verify Schema Compliance
        const parsed = WorkNodeSchema.safeParse(artifact);
        expect(parsed.success).toBe(true);

        // 3. Verify Traceability
        expect(artifact.metadata.version_hash).toBeTruthy();
        expect(artifact.metadata.origin).toBe('ai'); // Assembler defaults to AI

        // 4. Verify Content (Stub Logic)
        if (artifact.type === 'artifact') {
            expect(artifact.name).toContain(goal);
            // Assembler logic puts context ID in content
            // We can check if it mentions the graph node
            // The stub maps context nodes.
            // We won't assert exact format but basic existence. 
        }
    });

});
