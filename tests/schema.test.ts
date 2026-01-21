
import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
    ClaimNodeSchema,
    WorkNodeSchema,
    NodeMetadataSchema,
    OriginSchema,
} from '../src/canon/schema/ir';

// Helper to generate valid metadata parts
const generateBaseMetadata = (origin: 'human' | 'ai' | 'hybrid' = 'human') => ({
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version_hash: crypto.createHash('sha256').update('test').digest('hex'),
    origin,
});

describe('WorkGraph IR Schema V2 (Strict Canon)', () => {

    it('should validate a Claim node with strict metadata', () => {
        const validClaim = {
            id: uuidv4(),
            type: 'claim',
            statement: 'The earth is round',
            verification_status: 'verified',
            metadata: {
                ...generateBaseMetadata(),
                confidence: 1.0,
                validated: true,
                pin: true
            },
        };

        const result = WorkNodeSchema.safeParse(validClaim);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.type).toBe('claim');
            // Type narrowing check
            if (result.data.type === 'claim') {
                expect(result.data.metadata.pin).toBe(true);
            }
        }
    });

    it('should apply default metadata values (User-Friendly defaults)', () => {
        // Pin, Validated, Confidence should have defaults (as per Zod schema)
        // However, in Zod, defaults are applied when parsing *undefined* fields.
        // If we pass the object, we should see defaults if we omit them?
        // Actually Zod object defaults apply to the fields. 

        const minimalMeta = {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version_hash: crypto.createHash('sha256').update('test').digest('hex'),
            origin: 'human' as const,
        };

        const parsedMeta = NodeMetadataSchema.parse(minimalMeta);
        expect(parsedMeta.confidence).toBe(1.0);
        expect(parsedMeta.validated).toBe(false);
        expect(parsedMeta.pin).toBe(false);
    });

    it('should fail if Origin is missing', () => {
        const invalidMeta = {
            ...generateBaseMetadata(),
        } as any;
        delete invalidMeta.origin;

        const result = NodeMetadataSchema.safeParse(invalidMeta);
        expect(result.success).toBe(false);
    });

    it('should fail if Confidence is out of range', () => {
        const invalidMeta = {
            ...generateBaseMetadata(),
            confidence: 1.5 // > 1.0
        };
        const result = NodeMetadataSchema.safeParse(invalidMeta);
        expect(result.success).toBe(false);
    });

});
