import { traceSpan } from './observability';
import { retrieveContext } from './digest_engine';
import { generateText } from './llm/gateway';
import { AlignmentGap, AlignmentReport } from './alignment_types';

// Re-export for backwards compatibility
export type { AlignmentGap, AlignmentReport } from './alignment_types';

/**
 * [Hito 7.5] Universal Alignment Protocol (v2.0)
 * Combines Rust SAT solving for hard logic consistency with LLM semantic synthesis.
 */
export async function checkCrossBranchAlignment(
    sourceBranchId: string,
    targetBranchId: string
): Promise<AlignmentReport> {
    return traceSpan('alignment.compute_v2', { sourceBranchId, targetBranchId }, async () => {
        // Dynamic import to avoid circular dependencies and only load when needed
        const { useGraphStore } = await import('../store/useGraphStore');
        const { addRLMThought } = useGraphStore.getState();

        let satConsistent = true;
        let logicGaps: AlignmentGap[] = [];

        // 1. HARD LOGIC BREACH DETECTION (Rust logic-engine)
        try {
            const logicEngine = await import('logic-engine');
            await logicEngine.default?.();

            // Fetch context from both branches
            const sourceContext = await retrieveContext("RAW_PINS_ONLY", sourceBranchId, true);
            const targetContext = await retrieveContext("RAW_ALL", targetBranchId, true);

            const satInput = {
                nodes: [
                    ...parseNodesForSAT(sourceContext.text).filter(n => n.is_pin),
                    ...parseNodesForSAT(targetContext.text)
                ],
                edges: []
            };

            const satResult = JSON.parse(logicEngine.check_pin_consistency(JSON.stringify(satInput)));

            if (!satResult.consistent) {
                satConsistent = false;
                logicGaps = satResult.violations.map((v: string) => ({
                    sourceNodeId: "SAT_VIOLATION",
                    missingConcept: `LOGIC BREACH: ${v}`,
                    suggestedAction: "GENERATE_NODE"
                }));

                addRLMThought({
                    message: `HARD LOGIC BREACH: Branch alignment blocked by PIN violation.`,
                    type: 'error'
                });
            }
        } catch (err) {
            console.warn('[AlignmentEngine] SAT Solver failure:', err);
        }

        if (!satConsistent) {
            return { score: 0, gaps: logicGaps };
        }

        // 2. SEMANTIC INTENT ANALYSIS (RLM Swarm)
        const sourceDigest = await retrieveContext("Summary", sourceBranchId);
        const targetDigest = await retrieveContext("Summary", targetBranchId);

        const systemPrompt = `
ROLE:
You are the "RLM Alignment Swarm". Audit semantic coverage between Source Intent (A) and Target Implementation (B).

CONTEXT A (Intent):
${sourceDigest.text}

CONTEXT B (Implementation):
${targetDigest.text}

TASK:
1. Identify dependencies from A NOT covered in B.
2. Propose "Ghost Nodes" to fill these gaps.
3. Calculate Semantic Coverage Score (0-100).

OUTPUT (JSON ONLY):
{
  "score": number,
  "gaps": [
    { "sourceNodeId": "uuid", "missingConcept": "Description", "suggestedAction": "GENERATE_NODE" }
  ]
}
`;

        try {
            const llmResponse = await generateText(systemPrompt, "Audit Trans-Contextual Alignment", "REASONING");
            const report = JSON.parse(llmResponse.content);

            return {
                score: report.score || 0,
                gaps: report.gaps || []
            };
        } catch (err) {
            console.error('[AlignmentEngine] RLM Error:', err);
            return { score: 0, gaps: [] };
        }
    });
}

/**
 * Utility to parse simple RAW context strings back into SAT-compatible node objects
 */
function parseNodesForSAT(rawText: string): any[] {
    const lines = rawText.split('\n');
    return lines.map(line => {
        const idMatch = line.match(/\(([a-f0-9-]+)\)$/);
        return {
            id: idMatch ? idMatch[1] : `node-${Math.random()}`,
            is_pin: line.includes('PIN_INVARIANT') || line.includes('[PIN]'),
            node_type: line.match(/\[(.*?)\]/)?.[1]?.toLowerCase() || 'note'
        };
    });
}
