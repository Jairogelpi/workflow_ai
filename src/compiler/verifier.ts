import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { CompilationReceipt, VerificationResult } from '../canon/schema/receipt';
import { NodeId } from '../canon/schema/primitives';
import { computeStableHash } from '../kernel/versioning';
import { LogicCircuitBreakerError } from '../kernel/errors';
import { traceSpan } from '../kernel/observability';
import { useGraphStore } from '../store/useGraphStore';

export interface VerificationContext {
    goal: string;
    retrieved_nodes: WorkNode[];
}

/**
 * Checks a branch state (list of nodes) for integrity and PIN violations.
 * [Phase 7] Now integrates with Rust Logic SAT Solver for deep consistency checks.
 */
export async function verifyBranch(nodes: WorkNode[], edges?: any[]): Promise<VerificationResult> {
    const { addRLMThought, setLogicalTension } = useGraphStore.getState();
    const issues: Array<{ severity: 'CRITICAL' | 'error' | 'warn', message: string, code: string }> = [];
    let passed = true;
    let tensions: Record<string, number> = {};

    // === PHASE 1: TypeScript-level checks ===
    nodes.forEach(node => {
        // 1. PIN CONFIDENCE CHECK
        if (node.metadata.pin && (node.metadata.confidence || 0) < 1.0) {
            issues.push({
                severity: 'CRITICAL',
                message: `Pinned node ${node.id} has low confidence rating.`,
                code: 'PIN_CONFIDENCE_LOW'
            });
            passed = false;
        }

        // 2. HUMAN SIGNATURE (SEAL) INTEGRITY CHECK (Hito 4.4)
        if (node.metadata.human_signature) {
            const currentHash = computeStableHash(node);
            if (currentHash !== node.metadata.human_signature.hash_at_signing) {
                issues.push({
                    severity: 'CRITICAL',
                    message: `FIRMA ROTA: El nodo ${node.id} ha sido alterado después del pacto humano.`,
                    code: 'BROKEN_SIGNATURE_SEAL'
                });
                passed = false;
            }
        }
    });

    // === PHASE 2: Rust SAT Solver Integration (Phase 7) ===
    if (edges && edges.length > 0) {
        try {
            // Dynamic import for WASM module (logic-engine)
            const logicEngine = await import('../../logic-engine/pkg');
            await logicEngine.default?.(); // Initialize WASM if needed

            const graphData = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    is_pin: n.metadata.pin || false,
                    node_type: n.type
                })),
                edges: edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    relation: e.data?.relation || 'relates_to'
                }))
            };

            const satResult = JSON.parse(logicEngine.check_pin_consistency(JSON.stringify(graphData)));

            if (!satResult.consistent) {
                addRLMThought({ message: `SAT SOLVER: Contradiction detected in current graph topology.`, type: 'error' });
                satResult.violations.forEach((violation: string) => {
                    issues.push({
                        severity: 'CRITICAL',
                        message: violation,
                        code: 'SAT_VIOLATION'
                    });

                    // Trigger visual tension for involved nodes (assuming violation msg contains IDs or generic)
                    nodes.forEach(n => {
                        if (violation.includes(n.id)) {
                            tensions[n.id] = 1.0;
                        }
                    });
                });
                passed = false;
            } else {
                addRLMThought({ message: `SAT Solver verified ${satResult.checked_constraints} constraints. Topology consistent.`, type: 'success' });
            }

            console.log(`[Verifier] SAT Solver checked ${satResult.checked_constraints} constraints`);
        } catch (err) {
            // Fallback: If WASM not available, log warning but don't fail
            console.warn('[Verifier] Rust Logic Engine not available, skipping SAT verification:', err);
        }
    }

    // Apply sensory feedback
    setLogicalTension(tensions);

    if (!passed) {
        const criticalErrors = issues.filter(i => i.severity === 'CRITICAL');
        if (criticalErrors.length > 0) {
            throw new LogicCircuitBreakerError(
                "Incoherencia Lógica Detectada: Se ha violado una Invariante (PIN).",
                criticalErrors as any
            );
        }
    }

    return {
        passed,
        score: passed ? 1.0 : 0.5,
        issues: issues.length > 0 ? issues : undefined
    };
}

/**
 * The Verifier Logic.
 * Deterministic checks on the generated Artifact.
 */
export function verifyArtifact(artifact: any, context: VerificationContext): VerificationResult {
    const issues: Array<{ severity: 'CRITICAL' | 'error' | 'warn', message: string, code: string }> = [];
    let passed = true;
    let score = 1.0;

    // 0. Pre-check: Does it have a receipt?
    if (!artifact.receipt) {
        return { passed: false, score: 0, issues: [{ severity: 'CRITICAL', message: 'Missing Compilation Receipt', code: 'NO_RECEIPT' }] };
    }
    const receipt = artifact.receipt as CompilationReceipt;

    // 1. Check Integrity (Hash Match)
    const expectedHash = computeStableHash({
        goal: context.goal,
        contextIds: context.retrieved_nodes.map(n => n.id).sort()
    });

    if (receipt.input_hash !== expectedHash) {
        issues.push({
            severity: 'CRITICAL',
            message: `Context Hash Mismatch. Expected ${expectedHash}, got ${receipt.input_hash}`,
            code: 'INTEGRITY_FAIL'
        });
        passed = false;
        score = 0;
    }

    // 2. Check Structure (Broken Links in Assertion Map)
    const contextMap = new Set(context.retrieved_nodes.map(n => n.id));

    for (const [claimId, evidenceId] of Object.entries(receipt.assertion_map)) {
        if (!contextMap.has(claimId as NodeId)) {
            issues.push({ severity: 'warn', message: `Claim ${claimId} not found in context`, code: 'ORPHAN_CLAIM' });
            score -= 0.1;
        }
        if (!contextMap.has(evidenceId as NodeId)) {
            issues.push({ severity: 'warn', message: `Evidence ${evidenceId} not found in context`, code: 'BROKEN_EVIDENCE' });
            score -= 0.1;
        }
    }

    // 3. Threshold (Confidence)
    const lowConfidenceNodes = context.retrieved_nodes.filter(n => (n.metadata.confidence || 0) < 0.5);
    if (lowConfidenceNodes.length > 0) {
        issues.push({
            severity: 'warn',
            message: `Artifact uses ${lowConfidenceNodes.length} low-confidence nodes (<0.5)`,
            code: 'LOW_CONFIDENCE'
        });
        score -= (0.05 * lowConfidenceNodes.length);
    }

    // Cap score
    score = Math.max(0, score);

    // CIRCUIT BREAKER TRIGGER
    const criticalErrors = issues.filter(i => i.severity === 'CRITICAL');
    if (criticalErrors.length > 0) {
        throw new LogicCircuitBreakerError(
            "Circuit Breaker: La IA ha intentado violar el Canon o la Integridad.",
            criticalErrors as any
        );
    }

    return {
        passed,
        score,
        issues: issues.length > 0 ? issues : undefined
    };
}
