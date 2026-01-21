
import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { createPlan } from './planner';
import { retrieveContext } from './retriever';
import { assembleArtifact } from './assembler';
import { verifyArtifact } from './verifier';

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
    const artifact: any = await assembleArtifact(plan, contextNodes, contextObj);

    // 4. Verify
    console.log(`[PIPELINE] Verifying artifact...`);
    const verificationReport = verifyArtifact(artifact, { goal, retrieved_nodes: contextNodes });

    if (artifact.receipt) {
        artifact.receipt.verification_result = verificationReport;
    }

    if (!verificationReport.passed) {
        console.warn(`[PIPELINE] Verification FAILED for ${artifact.id}`, verificationReport.issues);
        // We could throw here, but for now we return the artifact with the FAIL report attached.
        // The consumer (UI/API) decides whether to show it.
    } else {
        console.log(`[PIPELINE] Verification PASSED (Score: ${verificationReport.score})`);
    }

    console.log(`[PIPELINE] Artifact generated: ${artifact.id}`);
    return artifact;
}

// Export parts for individual use if needed
export * from './types';
export * from './planner';
export * from './retriever';
export * from './assembler';
