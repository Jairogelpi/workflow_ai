
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

export const OriginSchema = z.enum(['human', 'ai', 'hybrid']);
export type Origin = z.infer<typeof OriginSchema>;

// --- Metadata ---

export const NodeMetadataSchema = z.object({
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
    version_hash: VersionHashSchema,
    origin: OriginSchema,
    // Optional: Audit trail link or similar could go here
});
export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;

// --- Nodes ---

const BaseNodeSchema = z.object({
    id: NodeIdSchema,
    metadata: NodeMetadataSchema,
});

export const NoteNodeSchema = BaseNodeSchema.extend({
    type: z.literal('note'),
    content: z.string(),
});

export const TaskNodeSchema = BaseNodeSchema.extend({
    type: z.literal('task'),
    title: z.string(),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked']),
    description: z.string().optional(),
});

export const IdeaNodeSchema = BaseNodeSchema.extend({
    type: z.literal('idea'),
    summary: z.string(),
    details: z.string().optional(),
});

export const SourceNodeSchema = BaseNodeSchema.extend({
    type: z.literal('source'),
    url: z.string().url().optional(),
    citation: z.string(),
});

export const WorkNodeSchema = z.discriminatedUnion('type', [
    NoteNodeSchema,
    TaskNodeSchema,
    IdeaNodeSchema,
    SourceNodeSchema,
]);
export type WorkNode = z.infer<typeof WorkNodeSchema>;

// --- Edges ---

export const RelationTypeSchema = z.enum(['relates_to', 'blocks', 'evidence_for']);
export type RelationType = z.infer<typeof RelationTypeSchema>;

export const WorkEdgeSchema = z.object({
    id: EdgeIdSchema,
    source: NodeIdSchema,
    target: NodeIdSchema,
    relation: RelationTypeSchema,
    metadata: NodeMetadataSchema,
});
export type WorkEdge = z.infer<typeof WorkEdgeSchema>;

// --- Graph ---

export const WorkGraphSchema = z.object({
    nodes: z.record(NodeIdSchema, WorkNodeSchema),
    edges: z.record(EdgeIdSchema, WorkEdgeSchema),
    // Graph-level metadata could go here
});
export type WorkGraph = z.infer<typeof WorkGraphSchema>;
