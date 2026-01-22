
import crypto from 'crypto';
import { WorkNode, NodeMetadata, VersionHash } from '../canon/schema/ir';

/**
 * Deterministically serializes a node (excluding metadata fields that change like updated_at/version_hash itself if we were to include it inside)
 * to ensure consistent hashing.
 * 
 * Strategy:
 * 1. Extract content fields based on node type.
 * 2. Sort keys.
 * 3. JSON.stringify.
 */
function canonicalizeNode(node: WorkNode): string {
    // We strictly structure what goes into the hash.
    // The ID is part of the identity.
    // The Type is part of the identity.
    // The Content fields are part of the identity.
    // Metadata: We include 'origin' and 'created_at' as they are immutable birth traits.
    // We excludes 'updated_at', 'version_hash' (circular), 'confidence' (variable?), 'validated' (variable), 'pin' (variable).
    // Actually, wait. If 'confidence' changes, does the VERSION change? Yes. 
    // In Git, any Change = New SHA.
    // So we should hash EVERYTHING except the previous hash pointer (if we had one) and the current hash field.

    // To avoid circular dependency or confusion, we clone and strip the version_hash.
    const clone = JSON.parse(JSON.stringify(node));

    // Remove the field we are about to calculate to avoid circularity if it was present.
    if (clone.metadata) {
        delete clone.metadata.version_hash;
    }

    // Stable stringify
    return stableStringify(clone);
}

/**
 * Computes a stable hash of any object by sorting keys recursively.
 * Used for integrity checks (Receipts).
 */
export function computeStableHash(obj: any): string {
    const canonical = stableStringify(obj);
    return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Simple stable JSON stringify (sorts keys recursively)
 */
export function stableStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const parts = keys.map(key => {
        return JSON.stringify(key) + ':' + stableStringify(obj[key]);
    });
    return '{' + parts.join(',') + '}';
}

/**
 * Computes the SHA-256 hash of a WorkNode.
 * This is the "Commit Hash" of the node's current state.
 */
export function computeNodeHash(node: WorkNode): VersionHash {
    const canonical = canonicalizeNode(node);
    const hash = crypto.createHash('sha256').update(canonical).digest('hex');
    return hash;
}

/**
 * Verifies if the node's `metadata.version_hash` matches its actual content.
 */
export function verifyIntegrity(node: WorkNode): boolean {
    if (!node.metadata || !node.metadata.version_hash) return false;

    const calculated = computeNodeHash(node);
    return calculated === node.metadata.version_hash;
}

/**
 * Creates a new metadata object for a node, calculating its hash and setting defaults.
 * This is the factory for "stamping" a node version.
 */
export function createVersion(
    node: WorkNode,
    previous_hash: VersionHash | null = null
): NodeMetadata {
    const now = new Date().toISOString();

    // 1. Prepare base metadata (without hash)
    const meta: NodeMetadata = {
        created_at: node.metadata?.created_at || now,
        updated_at: now,
        origin: node.metadata?.origin || 'human',
        confidence: node.metadata?.confidence ?? 1.0,
        validated: node.metadata?.validated ?? false,
        pin: node.metadata?.pin ?? false,
        version_hash: '' as VersionHash, // Placeholder
        ...(previous_hash ? { previous_version_hash: previous_hash } : {})
    };

    // 2. Attach partial metadata to node to calculate hash
    // We need to adhere to the rule: Hash = Hash(Content + Metadata_excluding_hash)
    // But wait, if we modify the node's metadata, we modify the node.
    // The node passed in should have the content we want.

    const nodeToHash = { ...node, metadata: meta };

    // 3. Compute Hash
    const hash = computeNodeHash(nodeToHash);

    // 4. Return final metadata
    return {
        ...meta,
        version_hash: hash
    };
}
