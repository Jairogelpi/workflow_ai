import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { CompilationReceipt, VerificationResult } from '../canon/schema/receipt';
import { NodeId } from '../canon/schema/primitives';
import { computeStableHash } from '../kernel/versioning';

export interface VerificationContext {
    goal: string;
    retrieved_nodes: WorkNode[];
}

/**
 * Checks a branch state (list of nodes) for integrity and PIN violations.
 */
export async function verifyBranch(nodes: WorkNode[]): Promise<VerificationResult> {
    const issues: Array<{ severity: 'error' | 'warn', message: string, code: string }> = [];
    let passed = true;

    nodes.forEach(node => {
        if (node.metadata.pin && (node.metadata.confidence || 0) < 1.0) {
            issues.push({
                severity: 'error',
                message: `Pinned node ${node.id} has low confidence rating.`,
                code: 'PIN_CONFIDENCE_LOW'
            });
            passed = false;
        }
    });

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
    const issues: Array<{ severity: 'error' | 'warn', message: string, code: string }> = [];
    let passed = true;
    let score = 1.0;

    // 0. Pre-check: Does it have a receipt?
    if (!artifact.receipt) {
        return { passed: false, score: 0, issues: [{ severity: 'error', message: 'Missing Compilation Receipt', code: 'NO_RECEIPT' }] };
    }
    const receipt = artifact.receipt as CompilationReceipt;

    // 1. Check Integrity (Hash Match)
    // Assembler logic: computeStableHash({ goal: plan.goal, contextIds: context.map(n => n.id).sort() })
    const expectedHash = computeStableHash({
        goal: context.goal,
        contextIds: context.retrieved_nodes.map(n => n.id).sort()
    });

    if (receipt.input_hash !== expectedHash) {
        issues.push({
            severity: 'error',
            message: `Context Hash Mismatch. Expected ${expectedHash}, got ${receipt.input_hash}`,
            code: 'INTEGRITY_FAIL'
        });
        passed = false;
        score = 0; // Integrity violation is fatal
    }

    // 2. Check Structure (Broken Links in Assertion Map)
    // For every ClaimID -> EvidenceID in map, do they exist in context?
    // Note: In our current stub types, assertionMap keys are NodeIds.
    // We strictly check if the claimed nodes exist in the graph (or context).
    // The context passed here is what was retrieved. The assertions should point to nodes in that context.

    // In a real scenario, we might check against the full graph, but RLM is usually context-bounded.
    // Let's check against context for now.
    const contextMap = new Set(context.retrieved_nodes.map(n => n.id));

    // Iterate entries
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
    // Check if used context has low confidence
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

    // Final decision
    if (!passed) score = 0; // Fail implies 0 score usually, or we keep it separte.

    return {
        passed,
        score,
        issues: issues.length > 0 ? issues : undefined
    };
}
