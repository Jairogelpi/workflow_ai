
import { z } from 'zod';
import { NodeIdSchema, TimestampSchema } from './primitives';

/**
 * Maps a specific Claim (Node ID) to the Evidence (Node ID) that supports it.
 * Key: Claim Node ID
 * Value: Evidence Node ID (or self if self-evident)
 */
export const AssertionMapSchema = z.record(NodeIdSchema, NodeIdSchema);
export type AssertionMap = z.infer<typeof AssertionMapSchema>;

// 1. Define Verification Result independent of the Receipt
export const VerificationResultSchema = z.object({
    passed: z.boolean(),
    score: z.number().min(0).max(1),
    issues: z.array(z.object({
        severity: z.enum(['CRITICAL', 'error', 'warn']),
        message: z.string(),
        code: z.string(),
        nodeId: z.string().optional()
    })).optional()
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// 2. Define Receipt
export const CompilationReceiptSchema = z.object({
    job_id: z.string().uuid().optional(),
    compiled_at: TimestampSchema,
    input_hash: z.string(), // Integrity check (Hash of Goal + Context IDs)
    assertion_map: AssertionMapSchema,

    // Forensic & Business Analytics (Hito 4.6)
    token_usage: z.number().optional(),
    latency_ms: z.number().optional(),
    cost_usd: z.number().optional(),

    // The result is optional in the receipt (it might not be verified yet)
    verification_result: VerificationResultSchema.optional()
});
export type CompilationReceipt = z.infer<typeof CompilationReceiptSchema>;

// Alias for backward compatibility if needed, but prefer VerificationResult
export const VerificationReportSchema = VerificationResultSchema;
export type VerificationReport = VerificationResult;
