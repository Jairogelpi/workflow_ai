declare module 'logic-engine' {
    /**
     * Checks if the graph maintains PIN consistency using SAT solving.
     * @param graph_json - JSON string with { nodes: [], edges: [] }
     * @returns JSON VerificationResult: { consistent, violations, checked_constraints }
     */
    export function check_pin_consistency(graph_json: string): string;

    export default function init(): Promise<void>;
}
