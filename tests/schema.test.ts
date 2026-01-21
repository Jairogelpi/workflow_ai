
import { describe, it, expect } from 'vitest'; // Using vitest or jest-like syntax
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
    NoteNodeSchema,
    NodeMetadataSchema,
    WorkNodeSchema,
    OriginSchema,
    NodeIdSchema,
} from '../src/canon/schema/ir';

// Helper to generate valid metadata
const generateMetadata = (origin: 'human' | 'ai' | 'hybrid' = 'human') => ({
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version_hash: crypto.createHash('sha256').update('test').digest('hex'),
    origin,
});

describe('WorkGraph IR Schema', () => {

    it('should validate a valid Note node', () => {
        const validNote = {
            id: uuidv4(),
            type: 'note',
            content: 'This is a test note',
            metadata: generateMetadata(),
        };

        const result = WorkNodeSchema.safeParse(validNote);
        expect(result.success).toBe(true);
    });

    it('should fail if ID is not a UUID', () => {
        const invalidNote = {
            id: 'not-a-uuid',
            type: 'note',
            content: 'Bad ID',
            metadata: generateMetadata(),
        };
        const result = WorkNodeSchema.safeParse(invalidNote);
        expect(result.success).toBe(false);
    });

    it('should fail if Origin is missing', () => {
        const invalidMeta = {
            id: uuidv4(),
            type: 'note',
            content: 'Missing Origin',
            metadata: {
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: crypto.createHash('sha256').update('test').digest('hex'),
                // origin missing
            }
        };
        const result = WorkNodeSchema.safeParse(invalidMeta);
        expect(result.success).toBe(false);
    });

    it('should validate strict Origin types', () => {
        expect(OriginSchema.safeParse('human').success).toBe(true);
        expect(OriginSchema.safeParse('alien').success).toBe(false);
    });

});
