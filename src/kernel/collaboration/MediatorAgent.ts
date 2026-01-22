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
            // En un entorno real, esto usaría el RLMCompiler para encontrar contradicciones
            const logicReport = await this.detectStructuralVoids(nodes as any, edges as any);
            if (logicReport.requiresAction) {
                for (const voidItem of logicReport.voids) {
                    const p = await this.negotiator.proposeChange({
                        type: 'ADD_RELATION',
                        reason: `Vacío Lógico detectado: "${voidItem.message}"`,
                        sourceNodeId: voidItem.nodeId,
                        relation: 'needs_evidence'
                    });
                    currentProposals.push(p);
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
        // Additional side effects (like actually creating nodes/edges) 
        // will be handled via GraphStore actions in the next task phase.
    }
}
