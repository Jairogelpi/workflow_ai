
import { z } from 'zod';

// --- Primitives & Brands ---

export const NodeIdSchema = z.string().uuid().brand('NodeId');
export type NodeId = z.infer<typeof NodeIdSchema>;

export const EdgeIdSchema = z.string().uuid().brand('EdgeId');
export type EdgeId = z.infer<typeof EdgeIdSchema>;

export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

export const VersionHashSchema = z.string().regex(/^[a-f0-9]{64}$/); // SHA-256
export type VersionHash = z.infer<typeof VersionHashSchema>;

export const OriginSchema = z.enum(['human', 'ai', 'hybrid', 'ai_proposal']);
export type Origin = z.infer<typeof OriginSchema>;

export const ConfidenceSchema = z.number().min(0).max(1);
export type Confidence = z.infer<typeof ConfidenceSchema>;
