declare module 'antigravity-engine' {
    /**
     * Initializes the WASM module.
     */
    export default function init(): Promise<void>;

    /**
     * Applies semantic gravity forces to a set of nodes.
     * @param nodes Serialized node array (WASM compatible).
     * @param edges Serialized edge array.
     */
    export function apply_forces(nodes: any, edges: any): any;
}
