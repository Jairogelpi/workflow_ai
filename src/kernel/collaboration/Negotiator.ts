/**
 * Gate 9: AI Mediator (Negotiator)
 * 
 * Translates technical conflicts and logical breakages into human-readable explanations.
 * Now supports autonomous Change Proposals from the Mediator Agent.
 */

import { MergePreflight } from './MergeEngine';
import { v4 as uuidv4 } from 'uuid';

export interface AIAnalysis {
    summary: string;
    suggestion: string;
    criticalNodes: string[];
}

export type ChangeProposalType = 'ADD_RELATION' | 'REFINE_RELATION' | 'CREATE_ARTIFACT' | 'MARK_STALE';

export interface ChangeProposal {
    id: string;
    type: ChangeProposalType;
    reason: string;
    sourceNodeId?: string;
    targetNodeId?: string;
    relation?: string;
    content?: any;
    status: 'draft' | 'accepted' | 'rejected';
}

export class Negotiator {
    private proposals: ChangeProposal[] = [];

    /**
     * Analyzes merge conflicts and invariant breaks to generate a human-centric report.
     */
    static async analyzeConflict(report: MergePreflight): Promise<AIAnalysis> {
        const summaryParts: string[] = [];
        const criticalNodes: string[] = [];

        if (report.conflicts.length > 0) {
            summaryParts.push(`Se detectaron ${report.conflicts.length} conflictos de edición concurrente.`);
            report.conflicts.forEach(c => criticalNodes.push(c.nodeId));
        }

        if (report.brokenInvariants.length > 0) {
            summaryParts.push(`Se detectaron ${report.brokenInvariants.length} violaciones de reglas lógicas (PINs).`);
            report.brokenInvariants.forEach(c => criticalNodes.push(c.nodeId));
        }

        let suggestion = "Revisa los cambios en los nodos marcados. ";
        if (report.brokenInvariants.length > 0) {
            suggestion += "El sistema sugiere proponer una 'Excepción de Invariante' si el cambio es necesario para la nueva dirección del proyecto.";
        } else {
            suggestion += "Se recomienda una reunión rápida de sincronización o elegir la versión con mayor confianza (confidence score).";
        }

        return {
            summary: summaryParts.join(' ') || 'No se detectaron problemas críticos. La fusión parece segura.',
            suggestion,
            criticalNodes: [...new Set(criticalNodes)]
        };
    }

    /**
     * Proposes a structural change to the graph.
     * These proposals appear as "Ghost Nodes" in the UI.
     */
    async proposeChange(proposal: Omit<ChangeProposal, 'id' | 'status'>): Promise<ChangeProposal> {
        const fullProposal: ChangeProposal = {
            id: uuidv4(),
            status: 'draft',
            ...proposal
        };

        this.proposals.push(fullProposal);
        console.log(`[NEGOTIATOR] New Proposal: ${fullProposal.type} - ${fullProposal.reason}`);

        // Notify Store or Hook to trigger UI render
        // This will be connected to useGraphStore in the next steps

        return fullProposal;
    }

    /**
     * Retrieves all active proposals.
     */
    getProposals(): ChangeProposal[] {
        return this.proposals.filter(p => p.status === 'draft');
    }

    /**
     * Accepts or rejects a proposal based on user feedback.
     */
    async resolveProposal(id: string, action: 'accept' | 'reject'): Promise<void> {
        const proposal = this.proposals.find(p => p.id === id);
        if (proposal) {
            proposal.status = action === 'accept' ? 'accepted' : 'rejected';
            console.log(`[NEGOTIATOR] Proposal ${id} ${action}ed`);
        }
    }

    /**
     * Explains a specific logical break to a user.
     */
    static async explainBrokenInvariant(nodeId: string, reason: string): Promise<string> {
        return `El cambio en el nodo [${nodeId}] contradice una regla de estableceida (${reason}). Esto ocurre cuando la nueva información choca con PINs previos.`;
    }
}
