import { traceSpan } from '../kernel/observability';
import { Plan, CompilerContext } from './types';
import { WorkNode, ArtifactNodeSchema } from '../canon/schema/ir';
import { CompilationReceipt, AssertionMap } from '../canon/schema/receipt';
import { NodeId } from '../canon/schema/primitives';
import { v4 as uuidv4 } from 'uuid';
import { createVersion, computeNodeHash, computeStableHash } from '../kernel/versioning';
import { DocManifest, DocTemplateData } from './templates/doc';

/**
 * The Assembler synthesizes the Plan and Retrieved Context into a final Artifact.
 * Now adds PCD (Proof-Carrying Data) via Receipts.
 */
export async function assembleArtifact(plan: Plan, context: WorkNode[], compilerContext?: CompilerContext): Promise<WorkNode> {
    return traceSpan('assembler.assemble_artifact', { goal: plan.goal, context_size: context.length }, async () => {
        // Stub Assertion Map
        const assertionMap: AssertionMap = {};
        context.forEach(node => {
            if (node.type === 'claim' && node.id) {
                // Mock: Link claim to itself or some evidence if found
                assertionMap[node.id as NodeId] = node.id as NodeId;
            }
        });

        // Prepare data for the template
        const templateData: DocTemplateData = {
            title: `Generated Artifact for: ${plan.goal}`,
            description: 'Automated output via RLM Compiler',
            sections: [
                {
                    title: 'Plan Execution',
                    content: plan.steps.map(s => `- [x] ${s.description}`).join('\n')
                },
                {
                    title: 'Context Used',
                    content: context.map(n => `- ${n.type}:${n.id}`).join('\n')
                },
                {
                    title: 'Receipt Data',
                    content: `Job ID: ${compilerContext?.jobId || 'N/A'}`
                }
            ]
        };

        // Render content using the Template
        const content = DocManifest.render(templateData);

        // Create Receipt
        const inputHash = computeStableHash({ goal: plan.goal, contextIds: context.map(n => n.id).sort() });

        const receipt: CompilationReceipt = {
            job_id: compilerContext?.jobId || uuidv4(),
            compiled_at: new Date().toISOString(),
            input_hash: inputHash, // Real stable hash
            assertion_map: assertionMap,
            token_usage: 0,
            latency_ms: 0
        };

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
            },
            receipt: receipt // Attach PCD
        };

        // Debug content attachment
        (artifact as any)._content_debug = content;

        // Stamp it with Kernel Versioning
        artifact.metadata = createVersion(artifact);

        return artifact as WorkNode;
    });
}
