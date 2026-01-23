/**
 * Alignment Engine Types (Hito 7.8)
 * Separated to avoid circular dependencies with useGraphStore.
 */

export interface AlignmentGap {
    sourceNodeId: string;
    missingConcept: string;
    suggestedAction: "GENERATE_NODE" | "LINK_EXISTING";
}

export interface AlignmentReport {
    score: number; // 0-100
    gaps: AlignmentGap[];
}
