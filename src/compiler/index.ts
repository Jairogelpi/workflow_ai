
import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { createPlan } from './planner';
import { retrieveContext } from './retriever';
import { assembleArtifact } from './assembler';

/**
 * The RLM Compiler Pipeline.
 * Orchestrates the flow: Prompt -> Plan -> Context -> Artifact.
 */
export async function runPipeline(goal: string, graph: WorkGraph): Promise<WorkNode> {
    console.log(`[PIPELINE] Starting compilation for: "${goal}"`);

    // 1. Plan
    const plan = await createPlan(goal);

    // 2. Retrieve
    const context = await retrieveContext(plan, graph);

    // 3. Assemble
    const artifact = await assembleArtifact(plan, context);

    console.log(`[PIPELINE] Artifact generated: ${artifact.id}`);
    return artifact;
}

// Export parts for individual use if needed
export * from './types';
export * from './planner';
export * from './retriever';
export * from './assembler';
