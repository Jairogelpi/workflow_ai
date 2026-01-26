import type { WorkNode } from '../../canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';
import { createVersion } from '../../kernel/versioning';

/**
 * Node Promoter Service
 * Handles the "Promotion" workflow: Idea -> Decision -> Execution.
 */
export async function promoteNode(node: WorkNode, targetType: 'decision' | 'task'): Promise<WorkNode> {
    const now = new Date().toISOString();

    // 1. Idea -> Decision
    if (node.type === 'idea' && targetType === 'decision') {
        const decisionNode: any = {
            ...node,
            type: 'decision',
            chosen_option: node.summary,
            rationale: (node as any).details || 'Promoted from Idea',
            metadata: {
                ...node.metadata,
                updated_at: now,
                origin: 'human' // Promotion is a human action
            }
        };
        // Re-calculate version hash
        decisionNode.metadata = createVersion(decisionNode);
        return decisionNode as WorkNode;
    }

    // 2. Decision -> Task (Execution/Plan)
    if (node.type === 'decision' && targetType === 'task') {
        const taskNode: any = {
            id: uuidv4(), // Tasks usually represent a new instance of action
            project_id: (node as any).project_id,
            type: 'task',
            title: `Execute: ${(node as any).chosen_option}`,
            status: 'todo',
            description: (node as any).rationale,
            metadata: {
                created_at: now,
                updated_at: now,
                origin: 'human',
                confidence: 1.0,
                validated: true,
                pin: false,
                version_hash: ''
            }
        };
        taskNode.metadata = createVersion(taskNode);
        return taskNode as WorkNode;
    }

    throw new Error(`Promotion from ${node.type} to ${targetType} is not supported.`);
}
