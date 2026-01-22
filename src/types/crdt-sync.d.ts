declare module 'crdt-sync' {
    /**
     * Creates a new CRDT document for collaborative editing.
     * @param initial_content - Initial text content.
     * @returns Base64-encoded state vector.
     */
    export function create_document(initial_content: string): string;

    /**
     * Applies a local update to the document.
     * @param state_vector_b64 - Current state vector (Base64).
     * @param content - Content to insert.
     * @param position - Position to insert at.
     * @returns JSON: { update, new_state }
     */
    export function apply_local_update(state_vector_b64: string, content: string, position: number): string;

    /**
     * Merges a remote update into the local document.
     * @param local_state_b64 - Local state vector (Base64).
     * @param remote_update_b64 - Remote update (Base64).
     * @returns JSON MergeResult: { success, merged_content, conflicts_resolved }
     */
    export function merge_remote_update(local_state_b64: string, remote_update_b64: string): string;

    /**
     * Computes the diff between two document states.
     */
    export function compute_diff(state_a_b64: string, state_b_b64: string): string;

    export default function init(): Promise<void>;
}
