
import { z } from 'zod';
import { NodeIdSchema, TimestampSchema } from './primitives';

/**
 * Maps a specific Claim (Node ID) to the Evidence (Node ID) that supports it.
 * This is the "Proof" structure.
 */
export const AssertionMapSchema = z.record(NodeIdSchema, NodeIdSchema);
export type AssertionMap = z.infer<typeof AssertionMapSchema>;

/**
 * A Receipt proves that a Compilation Job occurred.
 * It links the Output (Artifact) back to the Input (Context) and the Process (Time/Job).
 */
export const CompilationReceiptSchema = z.object({
    job_id: z.string().uuid(),
    compiled_at: TimestampSchema,
    input_hash: z.string(), // Hash of [Goal + Context IDs]
    assertion_map: AssertionMapSchema,
    // Optional diagnostics
    token_usage: z.number().optional(),
    latency_ms: z.number().optional(),
});
export type CompilationReceipt = z.infer<typeof CompilationReceiptSchema>;
