import { z } from 'zod';
import {
    NodeIdSchema, EdgeIdSchema, TimestampSchema, VersionHashSchema, OriginSchema, ConfidenceSchema
} from './primitives';

export * from './primitives'; // Re-export for convenience

// --- Metadata ---

// --- Metadata ---

export const NodeMetadataSchema = z.object({
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
    version_hash: VersionHashSchema,
    previous_version_hash: VersionHashSchema.optional(),
    origin: OriginSchema,
    // Critical operational fields
    confidence: ConfidenceSchema.default(1.0), // 1.0 = Human certainty, <1.0 = AI estimation
    validated: z.boolean().default(false),     // Explicit human validation flag
    pin: z.boolean().default(false),           // Invariant marker (Canon enforcement)
});
export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;

// --- Base Node ---

const BaseNodeSchema = z.object({
    id: NodeIdSchema,
    metadata: NodeMetadataSchema,
});

// --- Node Types (Reasoning Engine) ---

export const ClaimNodeSchema = BaseNodeSchema.extend({
    type: z.literal('claim'),
    statement: z.string(),
    verification_status: z.enum(['pending', 'verified', 'refuted']),
});

export const EvidenceNodeSchema = BaseNodeSchema.extend({
    type: z.literal('evidence'),
    content: z.string(),
    source_id: z.string().optional(), // Reference to an Artifact or Source
});

export const DecisionNodeSchema = BaseNodeSchema.extend({
    type: z.literal('decision'),
    rationale: z.string(),
    chosen_option: z.string(),
    alternatives: z.array(z.string()).optional(),
});

export const ConstraintNodeSchema = BaseNodeSchema.extend({
    type: z.literal('constraint'),
    rule: z.string(),
    enforcement_level: z.enum(['strict', 'flexible']),
});

export const AssumptionNodeSchema = BaseNodeSchema.extend({
    type: z.literal('assumption'),
    premise: z.string(),
    risk_level: z.enum(['low', 'medium', 'high']),
});

// --- Node Types (Management & Structure) ---

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

export const NoteNodeSchema = BaseNodeSchema.extend({
    type: z.literal('note'),
    content: z.string(),
});

import { CompilationReceiptSchema } from './receipt';

export const ArtifactNodeSchema = BaseNodeSchema.extend({
    type: z.literal('artifact'),
    name: z.string(),
    uri: z.string().url(), // Link to the actual file/deliverable
    mime_type: z.string().optional(),
    receipt: CompilationReceiptSchema.optional(), // Proof-Carrying extension
});

export const SourceNodeSchema = BaseNodeSchema.extend({
    type: z.literal('source'),
    url: z.string().url().optional(),
    citation: z.string(),
});


// --- Union ---

export const WorkNodeSchema = z.discriminatedUnion('type', [
    // Reasoning
    ClaimNodeSchema,
    EvidenceNodeSchema,
    DecisionNodeSchema,
    ConstraintNodeSchema,
    AssumptionNodeSchema,
    // Management
    TaskNodeSchema,
    ArtifactNodeSchema,
    // Structure
    IdeaNodeSchema,
    NoteNodeSchema,
    SourceNodeSchema
]);
export type WorkNode = z.infer<typeof WorkNodeSchema>;

// --- Edges ---

export const RelationTypeSchema = z.enum(['relates_to', 'blocks', 'evidence_for', 'validates', 'contradicts']);
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
});
export type WorkGraph = z.infer<typeof WorkGraphSchema>;
