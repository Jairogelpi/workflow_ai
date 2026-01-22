import { TextBlock } from './text-block-detector';

/**
 * Semantic Buffer
 * Batches text blocks for efficient LLM classification
 */
export class SemanticBuffer {
    private queue: TextBlock[] = [];
    private processing = false;
    private readonly BATCH_SIZE = 5;
    private readonly BATCH_INTERVAL_MS = 2000;
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private onClassify: (blocks: TextBlock[]) => Promise<void>
    ) { }

    /**
     * Add a text block to the queue
     */
    add(block: TextBlock): void {
        this.queue.push(block);

        // Start batch timer if not already running
        if (!this.timer) {
            this.timer = setTimeout(() => this.processBatch(), this.BATCH_INTERVAL_MS);
        }

        // Process immediately if batch is full
        if (this.queue.length >= this.BATCH_SIZE) {
            this.processBatch();
        }
    }

    /**
     * Process a batch of blocks
     */
    private async processBatch(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        // Clear timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        // Take batch
        const batch = this.queue.splice(0, this.BATCH_SIZE);

        try {
            await this.onClassify(batch);
        } catch (error) {
            console.error('[SemanticBuffer] Classification failed:', error);
        } finally {
            this.processing = false;

            // If there are more items, schedule next batch
            if (this.queue.length > 0) {
                this.timer = setTimeout(() => this.processBatch(), this.BATCH_INTERVAL_MS);
            }
        }
    }

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Clear the queue
     */
    clear(): void {
        this.queue = [];
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
