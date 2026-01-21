
import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { createPlan } from './planner';
import { retrieveContext } from './retriever';
import { assembleArtifact } from './assembler';

import { v4 as uuidv4 } from 'uuid';
import { CompilerContext } from './types';

/**
 * The RLM Compiler Pipeline.
 * Orchestrates the flow: Prompt -> Plan -> Context -> Artifact.
 */
export async function runPipeline(goal: string, graph: WorkGraph): Promise<WorkNode> {
    const jobId = uuidv4();
    console.log(`[PIPELINE] Starting compilation for: "${goal}" (Job: ${jobId})`);

    // 0. Init Context
    const contextObj: CompilerContext = {
        jobId,
        goal,
        retrieved_nodes: []
    };

    // 1. Plan
    const plan = await createPlan(goal);
    contextObj.plan = plan;

    // 2. Retrieve
    const contextNodes = await retrieveContext(plan, graph);
    contextObj.retrieved_nodes = contextNodes;

    // 3. Assemble
    // Pass the full context object to access JobID
    const artifact = await assembleArtifact(plan, contextNodes, contextObj);

    console.log(`[PIPELINE] Artifact generated: ${artifact.id}`);
    return artifact;
}

// Export parts for individual use if needed
export * from './types';
export * from './planner';
export * from './retriever';
export * from './assembler';
