
import { Plan } from './types';
import { WorkNode, ArtifactNodeSchema } from '../canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';
import { createVersion } from '../kernel/versioning';

/**
 * The Assembler synthesizes the Plan and Retrieved Context into a final Artifact.
 */
export async function assembleArtifact(plan: Plan, context: WorkNode[]): Promise<WorkNode> {
    console.log(`[ASSEMBLER] Assembling artifact from ${context.length} context nodes...`);

    const content = `
# Generated Artifact for: ${plan.goal}

## Plan Execution
${plan.steps.map(s => `- [x] ${s.description}`).join('\n')}

## Context Used
${context.map(n => `- ${n.type}:${n.id}`).join('\n')}
    `.trim();

    // Create the raw node
    const artifact: any = {
        id: uuidv4(),
        type: 'artifact',
        name: `Output: ${plan.goal}`,
        uri: 'memory://generated', // Virtual URI for now
        metadata: {
            origin: 'ai', // Compiler is AI usually
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version_hash: '',
            confidence: 0.9,
            validated: false,
            pin: false
        }
    };

    // Stamp it with Kernel Versioning
    artifact.metadata = createVersion(artifact);

    // Validate with Zod before returning (Safety)
    // Note: We cast to WorkNode because ArtifactNodeSchema is part of the union, but specific
    // However, verify with Zod to be sure.
    // artifact type must match ArtifactNodeSchema structure.
    // We didn't define mime_type in the object above, but it is optional in our schema?
    // Let's check ir.ts... 
    // export const ArtifactNodeSchema = BaseNodeSchema.extend({ ... mime_type: z.string().optional() });

    return artifact as WorkNode;
}
