import { createClient } from '../../lib/supabase';
import * as Verifier from '../../compiler/verifier';
import { traceSpan } from '../observability';
import { WorkNode } from '../../canon/schema/ir';

// Tipos para el reporte de análisis
export interface AnalysisReport {
    summary: string;
    category: 'logic_violation' | 'content_conflict' | 'clean_merge' | 'structural_void';
    severity: 'high' | 'medium' | 'low';
    suggestions: string[];
    ai_confidence: number;
    proposed_nodes?: WorkNode[];
}

export class MediatorAgent {

    /**
     * RLM-POWERED MEDIATION
     * 1. Verify (Deterministic, $0)
     * 2. Retrieve (Selective context)
     * 3. Explain (Humanize, low token cost)
     */
    static async runAnalysis(changeRequestId: string): Promise<AnalysisReport> {
        return traceSpan('mediator_rlm_analysis', { changeRequestId }, async () => {
            const supabase = await createClient();

            // PHASE 1: Verify (Deterministic, $0)
            const { data: cr } = await supabase
                .from('change_requests')
                .select('*, author:author_id(email)')
                .eq('id', changeRequestId)
                .single();

            if (!cr) throw new Error("CR not found");

            const sourceNodes = await this.fetchBranchNodes(cr.source_branch_id);
            const targetNodes = await this.fetchBranchNodes(cr.target_branch_id);
            const mergedState = this.simulateMergeState(sourceNodes, targetNodes);

            // Verificador Determinista
            const verification = await Verifier.verifyBranch(mergedState);
            const violations = verification.issues?.filter(i => i.severity === 'error') || [];

            // PHASE 2: Retrieve (Selective Context)
            let promptContext: any = {};
            if (violations.length > 0) {
                // Grave: Violación lógica
                promptContext = {
                    type: 'VIOLATION',
                    rules_broken: violations.map(v => v.message),
                    culprit_info: sourceNodes.filter(n => violations.some(v => v.message.includes(n.id)))
                };
            } else {
                // Leve: Conflicto de contenido
                const conflicts = this.detectContentConflicts(sourceNodes, targetNodes);
                promptContext = {
                    type: conflicts.length > 0 ? 'CONFLICT' : 'CLEAN',
                    diffs: conflicts
                };
            }

            // PHASE 3: Explain (Humanize, Low Cost)
            let analysis: AnalysisReport;

            if (promptContext.type === 'VIOLATION') {
                analysis = {
                    summary: `RLM Detector: Se han identificado ${violations.length} violaciones de integridad lógica. El cambio contradice reglas fundamentales del grafo.`,
                    category: 'logic_violation',
                    severity: 'high',
                    suggestions: ["Revisar reglas de invariancia", "Contactar al autor original del nodo PIN"],
                    ai_confidence: 1.0
                };
            } else if (promptContext.type === 'CONFLICT') {
                analysis = {
                    summary: `Conflicto detectado: ${promptContext.diffs.length} nodos han sido editados simultáneamente con valores diferentes.`,
                    category: 'content_conflict',
                    severity: 'medium',
                    suggestions: ["Elegir versión ganadora", "Fusión manual"],
                    ai_confidence: 0.95
                };
            } else {
                analysis = {
                    summary: "Análisis RLM completado: Todos los cambios respetan los invariantes lógicos.",
                    category: 'clean_merge',
                    severity: 'low',
                    suggestions: ["Aprobar fusión"],
                    ai_confidence: 0.99
                };
            }

            // Persistence
            await supabase.from('change_requests').update({
                analysis_report: analysis,
                semantic_check_passed: promptContext.type === 'CLEAN',
                status: promptContext.type === 'CLEAN' ? 'open' : 'reviewing'
            }).eq('id', changeRequestId);

            return analysis;
        });
    }

    /**
     * VOID INFERENCE (RLM Planner integration)
     * Detects claims without evidence and suggests search/discovery nodes.
     */
    static inferVoids(nodes: WorkNode[], edges: any[]): AnalysisReport {
        const claims = nodes.filter(n => n.type === 'claim');
        const unsupportedClaims = claims.filter(c => {
            return !edges.some(e => (e.target === c.id || e.source === c.id) && e.relation === 'evidence_for');
        });

        if (unsupportedClaims.length === 0) {
            return {
                summary: "Topología robusta: Todas las afirmaciones tienen respaldo.",
                category: 'clean_merge',
                severity: 'low',
                suggestions: [],
                ai_confidence: 0.9
            };
        }

        return {
            summary: `Se han detectado ${unsupportedClaims.length} Claims sin evidencia de soporte (Vacíos Lógicos).`,
            category: 'structural_void',
            severity: 'medium',
            suggestions: unsupportedClaims.map(c => `Buscar evidencia para: ${(c as any).statement}`),
            ai_confidence: 0.85
        };
    }

    /**
     * FORENSIC INTEGRITY CHECK
     * Real-time verification of PIN nodes and logical consistencies.
     */
    static async verifyGraphIntegrity(nodes: WorkNode[]): Promise<AnalysisReport> {
        try {
            const report = await Verifier.verifyBranch(nodes);
            if (report.passed) {
                return {
                    summary: "Integridad Forense confirmada: El grafo es coherente con el Canon.",
                    category: 'clean_merge',
                    severity: 'low',
                    suggestions: [],
                    ai_confidence: 1.0
                };
            }

            const violations = report.issues?.filter(i => i.severity === 'CRITICAL' || i.severity === 'error') || [];

            return {
                summary: `ALERTA DE INCONSISTENCIA: Se han detectado ${violations.length} violaciones de integridad.`,
                category: 'logic_violation',
                severity: 'high',
                suggestions: violations.map(v => v.message),
                ai_confidence: 1.0
            };

        } catch (error: any) {
            return {
                summary: `Error de Integridad Lógica: ${error.message}`,
                category: 'logic_violation',
                severity: 'high',
                suggestions: ["Revertir últimos cambios", "Ajustar PINs"],
                ai_confidence: 1.0
            };
        }
    }

    private static async fetchBranchNodes(projectId: string): Promise<WorkNode[]> {
        const supabase = await createClient();
        const { data } = await supabase.from('work_nodes').select('*').eq('project_id', projectId);
        return (data || []).map(row => ({
            id: row.id,
            type: row.type,
            ...row.content,
            metadata: { ...row.metadata, pin: row.is_pinned, validated: row.is_validated }
        })) as unknown as WorkNode[];
    }

    private static detectContentConflicts(source: WorkNode[], target: WorkNode[]) {
        const diffs: any[] = [];
        for (const sn of source) {
            const tn = target.find(n => n.id === sn.id);
            if (tn && JSON.stringify({ ...sn, metadata: undefined }) !== JSON.stringify({ ...tn, metadata: undefined })) {
                diffs.push({ id: sn.id, type: sn.type });
            }
        }
        return diffs;
    }

    private static simulateMergeState(source: WorkNode[], target: WorkNode[]): WorkNode[] {
        const merged = [...target];
        for (const sn of source) {
            const idx = merged.findIndex(n => n.id === sn.id);
            if (idx > -1) merged[idx] = sn;
            else merged.push(sn);
        }
        return merged;
    }
}
