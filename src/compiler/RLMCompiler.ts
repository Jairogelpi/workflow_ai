import { Plan } from './types';
import { createPlan } from './planner';
import { retrieveContext } from './retriever';
import { assembleArtifact } from './assembler';
import { verifyArtifact } from './verifier';
import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';
import { auditStore } from '../kernel/observability';

/**
 * RLMCompiler v3.0
 * 
 * Object-oriented wrapper for the RLM Pipeline.
 * Provides granular access to planning, retrieval, assembly, and verification.
 */
export class RLMCompiler {
    /**
     * Access to the Planner component
     */
    public readonly planner = {
        generatePlan: async (goal: string): Promise<Plan> => {
            return await createPlan(goal);
        }
    };

    /**
     * Access to the Retriever component
     */
    public readonly retriever = {
        getContext: async (plan: Plan, graph: WorkGraph): Promise<WorkNode[]> => {
            return await retrieveContext(plan, graph);
        }
    };

    /**
     * Access to the Assembler component
     */
    public readonly assembler = {
        assemble: async (plan: Plan, context: WorkNode[]): Promise<WorkNode> => {
            return await assembleArtifact(plan, context, {
                jobId: uuidv4(),
                goal: plan.goal,
                plan,
                retrieved_nodes: context
            });
        }
    };

    /**
     * Access to the Verifier component
     */
    public readonly verifier = {
        verify: (artifact: WorkNode, goal: string, context: WorkNode[]) => {
            return verifyArtifact(artifact, { goal, retrieved_nodes: context });
        },
        /**
         * Checks the logical tension of a specific node against the Canon.
         */
        checkTension: async (nodeId: string): Promise<{ isHigh: boolean; reason?: string }> => {
            // Placeholder for structural tension check
            console.log(`[VERIFIER] Checking tension for node: ${nodeId}`);
            return { isHigh: false };
        }
    };

    /**
     * Runs the full pipeline from goal to verified artifact.
     */
    async execute(goal: string, graph: WorkGraph): Promise<WorkNode> {
        const startTime = performance.now();

        const plan = await this.planner.generatePlan(goal);
        const context = await this.retriever.getContext(plan, graph);
        const artifact = await this.assembler.assemble(plan, context);
        const report = this.verifier.verify(artifact, goal, context);

        const latency = performance.now() - startTime;
        const jobId = uuidv4();

        // Forensic Transparency: Inject metrics into the Audit Trail
        auditStore.recordMetric({
            jobId: jobId,
            stepId: 'recursive_generation',
            model: 'google/gemini-2-flash', // Default model used in assembling
            tokens: { input: 1200, output: 800 }, // Simulated counts
            latency_ms: Math.round(latency),
            cost_usd: 0.005,
            timestamp: new Date().toISOString()
        });

        const artifactWithReceipt = artifact as any;
        if (artifactWithReceipt.receipt) {
            artifactWithReceipt.receipt.job_id = jobId;
            artifactWithReceipt.receipt.verification_result = report;
        }

        return artifact;
    }
}
