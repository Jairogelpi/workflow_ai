/**
 * Gate 9: Merge Engine (Semantic Governance)
 * Orchestrates the fusion of branches while enforcing logical integrity.
 */

import { createClient } from '../../lib/supabase';
import { verifyArtifact } from '../../compiler/verifier';
import { canModifyNode } from '../guards';
import { traceSpan } from '../observability';
import { WorkNode, WorkGraph } from '../../canon/schema/ir';
import { Negotiator } from './Negotiator';

export interface MergePreflight {
    safe: boolean;
    conflicts: Array<{ nodeId: string, reason: string }>;
    brokenInvariants: Array<{ nodeId: string, reason: string }>;
}

export class MergeEngine {

    /**
     * Analiza si una Change Request (CR) es segura de fusionar.
     * Ejecuta 3 niveles de defensa: Conflictos físicos, Integridad de Grafos e Invariantes.
     */
    static async preflightCheck(changeRequestId: string): Promise<MergePreflight> {
        return traceSpan('merge_preflight', { changeRequestId }, async () => {
            try {
                const supabase = await createClient();

                // 1. Obtener datos de la CR
                const { data: cr, error } = await supabase
                    .from('change_requests')
                    .select('*, source_branch_id, target_branch_id')
                    .eq('id', changeRequestId)
                    .single();

                if (error || !cr) {
                    throw new Error(`CR not found: ${error?.message}`);
                }

                // 2. Fetch Nodes from Source and Target
                const sourceNodes = await this.fetchNodes(cr.source_branch_id);
                const targetNodes = await this.fetchNodes(cr.target_branch_id);

                // 3. Chequeo de Conflictos Físicos (Mismo nodo editado)
                const conflicts = this.detectEditConflicts(sourceNodes, targetNodes);

                // 4. Chequeo Semántico (Simulación de Fusión)
                const mergedNodes = this.simulateMerge(sourceNodes, targetNodes);
                const brokenInvariants: Array<{ nodeId: string, reason: string }> = [];

                for (const node of mergedNodes) {
                    const targetNode = targetNodes.find(tn => tn.id === node.id);
                    if (targetNode && targetNode.metadata.pin) {
                        // Compare serialized content (excluding metadata which contains volatile timestamps/hashes)
                        const snStrip = { ...node, metadata: undefined };
                        const tnStrip = { ...targetNode, metadata: undefined };

                        if (JSON.stringify(snStrip) !== JSON.stringify(tnStrip)) {
                            brokenInvariants.push({
                                nodeId: node.id,
                                reason: 'Target node is PINNED (Immutable Invariant)'
                            });
                        }
                    }
                }

                const result = {
                    safe: conflicts.length === 0 && brokenInvariants.length === 0,
                    conflicts,
                    brokenInvariants
                };

                // AI Mediation (Gate 9 Twist)
                const aiAnalysis = await Negotiator.analyzeConflict(result);

                // 5. Update CR status with report
                await supabase.from('change_requests').update({
                    semantic_check_passed: result.safe,
                    conflict_report: result,
                    analysis_report: aiAnalysis // Store GPT-generated negotiation points
                }).eq('id', changeRequestId);

                return result;
            } catch (e: any) {
                console.error(`[MergeEngine] FATAL ERROR: ${e.message}`);
                throw e;
            }
        });
    }

    private static async fetchNodes(projectId: string): Promise<WorkNode[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('work_nodes')
            .select('*')
            .eq('project_id', projectId);

        if (error) {
            console.error(`[MergeEngine] Error fetching nodes: ${error.message}`);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            type: row.type,
            ...row.content, // Spread semantic fields (statement, rationale, etc.)
            metadata: {
                ...row.metadata,
                pin: row.is_pinned,
                validated: row.is_validated
            }
        })) as unknown as WorkNode[];
    }

    private static detectEditConflicts(source: WorkNode[], target: WorkNode[]) {
        const conflicts: Array<{ nodeId: string, reason: string }> = [];
        for (const sn of source) {
            const tn = target.find(n => n.id === sn.id);
            if (tn) {
                // Strip metadata for structural comparison
                const snS = { ...sn, metadata: undefined };
                const tnS = { ...tn, metadata: undefined };
                if (JSON.stringify(snS) !== JSON.stringify(tnS)) {
                    conflicts.push({ nodeId: sn.id, reason: 'Concurrent modification detected' });
                }
            }
        }
        return conflicts;
    }

    private static simulateMerge(source: WorkNode[], target: WorkNode[]): WorkNode[] {
        const merged = [...target];
        for (const sn of source) {
            const index = merged.findIndex(n => n.id === sn.id);
            if (index > -1) {
                merged[index] = sn; // Update
            } else {
                merged.push(sn); // Add
            }
        }
        return merged;
    }

    /**
     * [Phase 7] CRDT-based conflict-free merge using Rust engine.
     * Returns the merged content when two users edit the same node.
     */
    static async crdtMerge(localState: string, remoteUpdate: string): Promise<{
        success: boolean;
        merged_content: string;
        conflicts_resolved: number;
    }> {
        try {
            const crdtSync = await import('../../../crdt-sync/pkg');
            await crdtSync.default?.(); // Initialize WASM

            const result = JSON.parse(crdtSync.merge_remote_update(localState, remoteUpdate));

            console.log(`[MergeEngine] CRDT merge: ${result.conflicts_resolved} conflicts auto-resolved`);
            return result;
        } catch (err) {
            console.warn('[MergeEngine] CRDT engine not available, using fallback merge:', err);
            // Fallback: prefer remote (last-write-wins)
            return {
                success: true,
                merged_content: remoteUpdate,
                conflicts_resolved: 0
            };
        }
    }

    /**
     * [Phase 7] Creates a CRDT document for collaborative editing.
     */
    static async createCrdtDocument(initialContent: string): Promise<string> {
        try {
            const crdtSync = await import('../../../crdt-sync/pkg');
            await crdtSync.default?.();
            return crdtSync.create_document(initialContent);
        } catch (err) {
            console.warn('[MergeEngine] CRDT engine not available:', err);
            return '';
        }
    }
}
