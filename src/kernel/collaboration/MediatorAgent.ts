/**
 * MEDIATOR AGENT v3.0 - RLM Core
 * 
 * The system's "Operational Brain". 
 * Performs cross-kernel reasoning, void detection, and recursive abstraction.
 * 
 * Implements "Kernel to Kernel" dialogue by proposing ChangeProposals (Drafts).
 */

import { RLMCompiler } from '../../compiler/RLMCompiler';
import { Negotiator, ChangeProposal } from './Negotiator';
import { createHierarchicalDigest } from '../digest_engine';
import { useGraphStore } from '../../store/useGraphStore';
import { traceSpan } from '../observability';
import { TaskTier, SmartRouter, predictCost, generateText } from '../llm/gateway';
import { useSettingsStore } from '../../store/useSettingsStore';
import { WorkNode } from '../../canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';

export class MediatorAgent {
    private compiler = new RLMCompiler();
    private negotiator = new Negotiator();

    /**
     * The "Pulse" (Inference Cycle).
     * Analiza el grafo y propone cambios estructurales sin intervención humana inicial.
     */
    async pulse(projectId: string): Promise<ChangeProposal[]> {
        const { nodes, edges } = useGraphStore.getState();

        return await traceSpan('mediator.pulse', { projectId, nodeCount: nodes.length }, async () => {
            console.log(`[MEDIATOR] Starting pulse for project: ${projectId}`);
            const currentProposals: ChangeProposal[] = [];

            // 1. RLM Reasoning: Identify Structural Voids
            // Analyzes graph topology to find disconnected claims.
            const logicReport = await this.detectStructuralVoids(nodes as any, edges as any);
            if (logicReport.requiresAction) {
                // Lazy load Consensus to avoid cyclic deps if any
                const { ConsensusEngine } = await import('../consensus_engine');

                for (const voidItem of logicReport.voids) {
                    const p = await this.negotiator.proposeChange({
                        type: 'ADD_RELATION',
                        reason: `Vacío Lógico detectado: "${voidItem.message}"`,
                        sourceNodeId: voidItem.nodeId,
                        relation: 'needs_evidence'
                    });

                    // [Neuro-Symbolic Arbiter] Pre-flight Check
                    const consensus = await ConsensusEngine.validateProposal(p, nodes as any, edges as any);
                    if (consensus.approved) {
                        currentProposals.push(p);
                    } else {
                        console.warn(`[MEDIATOR] Proposal rejected by Logic Kernel: ${consensus.reason}`);
                        // Negative Reward: We track this rejection to adjust future RLM prompts (Future work)
                    }
                }
            }

            // 2. High Tension Check (Verifier)
            for (const node of nodes) {
                const tension = await this.compiler.verifier.checkTension(node.id);
                if (tension.isHigh) {
                    const p = await this.negotiator.proposeChange({
                        type: 'REFINE_RELATION',
                        reason: `Tensión lógica alta: ${tension.reason || 'Posible contradicción con el Canon (PIN)'}`,
                        targetNodeId: node.id
                    });
                    currentProposals.push(p);
                }
            }

            // 3. Recursive Abstraction: Cluster Detection
            const abstractionProposals = await this.performRecursiveAbstraction(nodes as any);
            currentProposals.push(...abstractionProposals);

            return currentProposals;
        });
    }

    /**
     * Detects structural voids in the graph topology.
     */
    private async detectStructuralVoids(nodes: WorkNode[], edges: any[]) {
        const claims = nodes.filter(n => n.type === 'claim');
        const voids = claims
            .filter(c => !edges.some(e => e.target === c.id || e.source === c.id))
            .map(c => ({
                nodeId: c.id,
                message: `La afirmación no tiene conexiones lógicas.`
            }));

        return {
            requiresAction: voids.length > 0,
            voids
        };
    }

    /**
     * Detects clusters of low-abstraction nodes and suggests a higher-level Digest/Artifact.
     */
    private async performRecursiveAbstraction(nodes: WorkNode[]): Promise<ChangeProposal[]> {
        const proposals: ChangeProposal[] = [];

        // Strategy: Group Evidence nodes that share tags or parent context
        const evidenceNodes = nodes.filter(n => n.type === 'evidence');

        if (evidenceNodes.length > 5) {
            const digest = await createHierarchicalDigest(evidenceNodes as any);
            const p = await this.negotiator.proposeChange({
                type: 'CREATE_ARTIFACT',
                reason: 'Abstracción Automática: Grupo de evidencias consolidado en un artefacto.',
                content: {
                    title: 'Síntesis de Evidencias',
                    summary: digest.summary,
                    sourceNodeIds: evidenceNodes.map(n => n.id)
                }
            });
            proposals.push(p);
        }

        return proposals;
    }

    /**
     * Interface with the Store to accept/reject proposals
     */
    async handleUserDecision(proposalId: string, decision: 'accept' | 'reject'): Promise<void> {
        await this.negotiator.resolveProposal(proposalId, decision);
    }

    /**
     * Executes an inference task with Smart Routing and Budget Control.
     */
    /**
     * Executes an inference task with support for tools (Swarm Agency).
     */
    public async performInferenceWithTools(
        prompt: string,
        tier: TaskTier,
        tools: any[],
        images?: string[]
    ): Promise<{ content: string; toolCalls?: any[] }> {
        const modelId = SmartRouter.getOptimalModel(tier);
        const estimatedCost = predictCost("", prompt, modelId);

        return await traceSpan('mediator.agency', { modelId, tier, estimatedCost }, async () => {
            return await generateText(
                "You are the Mediator Agent for WorkGraph OS. You have tools available to interact with the system.",
                prompt,
                tier,
                tools,
                images
            );
        });
    }

    private async performInferenceTask(prompt: string, tier: TaskTier): Promise<string> {
        const result = await this.performInferenceWithTools(prompt, tier, [], []);
        return result.content;
    }
}
