
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
        severity: z.enum(['error', 'warn']),
        message: z.string(),
        code: z.string()
    })).optional()
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// 2. Define Receipt
export const CompilationReceiptSchema = z.object({
    job_id: z.string().uuid(),
    compiled_at: TimestampSchema,
    input_hash: z.string(), // Integrity check (Hash of Goal + Context IDs)
    assertion_map: AssertionMapSchema,

    // Optional diagnostics
    token_usage: z.number().optional(),
    latency_ms: z.number().optional(),

    // The result is optional in the receipt (it might not be verified yet), 
    // but the type VerificationResult itself matches the object structure.
    verification_result: VerificationResultSchema.optional()
});
export type CompilationReceipt = z.infer<typeof CompilationReceiptSchema>;

// Alias for backward compatibility if needed, but prefer VerificationResult
export const VerificationReportSchema = VerificationResultSchema;
export type VerificationReport = VerificationResult;
