/**
 * Gate 9: AI Mediator (Negotiator)
 * Translates technical conflicts and logical breakages into human-readable explanations.
 */

import { MergePreflight } from './MergeEngine';

export interface AIAnalysis {
    summary: string;
    suggestion: string;
    criticalNodes: string[];
}

export class Negotiator {

    /**
     * Analyzes merge conflicts and invariant breaks to generate a human-centric report.
     */
    static async analyzeConflict(report: MergePreflight): Promise<AIAnalysis> {
        // In a production 2026 environment, this would call an LLM (e.g. Gemini/GPT-4)
        // providing the context of the nodes, their types, and the nature of the conflict.

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

        // AI Negotiation Simulation
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
     * Explains a specific logical break to a user.
     */
    static async explainBrokenInvariant(nodeId: string, reason: string): Promise<string> {
        // Simulated AI explanation
        return `El cambio en el nodo [${nodeId}] contradice una regla de negocio establecida (${reason}). Esto suele ocurrir cuando la nueva información choca con decisiones de diseño previas que fueron marcadas como inamovibles.`;
    }
}
