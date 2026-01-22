/**
 * Digestive Engine: Recursive Chunking
 * High-performance text splitting for the WorkGraph OS.
 */

interface ChunkOptions {
    chunkSize: number;
    chunkOverlap: number;
}

const DEFAULT_OPTIONS: ChunkOptions = {
    chunkSize: 2000,
    chunkOverlap: 200,
};

/**
 * Recursively splits text into chunks based on semantic separators.
 * Preserves context by using an overlap window.
 */
export function chunkText(text: string, options: Partial<ChunkOptions> = {}): string[] {
    const { chunkSize, chunkOverlap } = { ...DEFAULT_OPTIONS, ...options };
    const chunks: string[] = [];

    // Safety check for empty text
    if (!text || text.trim().length === 0) return [];

    let currentIdx = 0;
    while (currentIdx < text.length) {
        let endIdx = currentIdx + chunkSize;

        // If we're not at the very end, try to find a nice break point
        if (endIdx < text.length) {
            // Priority separators: paragraph, sentence, word
            const separators = ['\n\n', '\n', '. ', ' '];
            let foundSeparator = false;

            for (const sep of separators) {
                const lastSepIdx = text.lastIndexOf(sep, endIdx);
                // Don't break too far back (limit search to 20% of chunk size)
                if (lastSepIdx > currentIdx + (chunkSize * 0.8)) {
                    endIdx = lastSepIdx + sep.length;
                    foundSeparator = true;
                    break;
                }
            }
        }

        chunks.push(text.substring(currentIdx, endIdx).trim());

        // Move forward, but back up by the overlap
        currentIdx = endIdx - chunkOverlap;

        // Prevent infinite loop if overlap >= chunk size or no progress
        if (currentIdx <= (endIdx - chunkSize)) {
            currentIdx = endIdx;
        }
    }

    return chunks.filter(c => c.length > 0);
}
