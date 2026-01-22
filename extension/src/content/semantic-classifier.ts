import { TextBlock } from './text-block-detector';

/**
 * Semantic Classifier
 * Uses LLM to classify text blocks into IR types
 */

export async function classifyTextBlocks(blocks: TextBlock[]): Promise<TextBlock[]> {
    console.log(`[SemanticClassifier] Classifying ${blocks.length} blocks...`);

    // For now, we'll classify each block individually
    // In production, you might batch them in a single LLM call
    const classified = await Promise.all(
        blocks.map(block => classifySingleBlock(block))
    );

    return classified;
}

async function classifySingleBlock(block: TextBlock): Promise<TextBlock> {
    try {
        // Send to background script for classification
        const response = await chrome.runtime.sendMessage({
            type: 'CLASSIFY_TEXT',
            text: block.text
        });

        if (response?.success && response.classification) {
            block.classification = response.classification;
            block.analyzed = true;
        }

    } catch (error) {
        console.error('[SemanticClassifier] Classification failed for block:', error);
        // Default to neutral if classification fails
        block.classification = { type: 'neutral', confidence: 0 };
        block.analyzed = true;
    }

    return block;
}

/**
 * Simple local heuristic classifier (fallback if LLM is unavailable)
 */
export function classifyHeuristic(text: string): { type: 'claim' | 'evidence' | 'assumption' | 'neutral'; confidence: number } {
    const lower = text.toLowerCase();

    // Claim indicators
    if (lower.match(/\b(is|are|will|must|should|always|never)\b/) && !lower.match(/\?/)) {
        return { type: 'claim', confidence: 0.6 };
    }

    // Evidence indicators
    if (lower.match(/\b(study|research|data|found|showed|according to|percent|%)\b/)) {
        return { type: 'evidence', confidence: 0.7 };
    }

    // Assumption indicators
    if (lower.match(/\b(assume|suppose|if|given that|assuming)\b/)) {
        return { type: 'assumption', confidence: 0.65 };
    }

    return { type: 'neutral', confidence: 0.5 };
}
