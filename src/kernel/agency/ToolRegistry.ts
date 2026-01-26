/**
 * Phase 18: Swarm Agency - Tool Registry
 * Central hub for agent-driven actions and tool-use.
 */

import { KernelBridge } from '../KernelBridge';
import { canModifyNode } from '../guards';
import { NodeId, VersionHash } from '../../canon/schema/primitives';

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any; // JSON Schema
    execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
    private static tools: Map<string, ToolDefinition> = new Map();

    static register(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
    }

    static getToolsForLLM() {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));
    }

    static async call(name: string, args: any) {
        const tool = this.tools.get(name);
        if (!tool) throw new Error(`Tool ${name} not found`);
        console.log(`[AGENCY] Executing tool ${name} with args:`, args);
        return await tool.execute(args);
    }

    // Initial tool set
    static initialize() {
        this.register({
            name: 'create_work_node',
            description: 'Creates a new real node in the graph based on analysis.',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['note', 'claim', 'evidence', 'idea'] },
                    content: { type: 'string' },
                    title: { type: 'string' }
                },
                required: ['type', 'content']
            },
            execute: async ({ type, content, title }) => {
                const id = `node-${Date.now()}` as NodeId;

                const newNode: any = {
                    id,
                    type,
                    [type === 'claim' ? 'statement' : 'content']: content,
                    metadata: {
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        version_hash: '' as VersionHash,
                        origin: 'ai_proposal',
                        confidence: 0.9,
                        access_control: {
                            role_required: 'editor',
                            owner_id: 'swarm-orchestrator'
                        }
                    }
                };

                // Decoupled Action: Emit command to KernelBridge
                KernelBridge.emit({
                    type: 'CMD_ADD_NODE',
                    payload: {
                        node: newNode,
                        position: { x: Math.random() * 500, y: Math.random() * 500 }
                    }
                });

                return { success: true, nodeId: id };
            }
        });

        // [Real Tool] Web Search via Server Action
        this.register({
            name: 'web_search',
            description: 'Searches the real web for information (Wikipedia/External Sources).',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string' }
                },
                required: ['query']
            },
            execute: async ({ query }: { query: string }) => {
                // Dynamic import to use Server Action 
                const { performWebSearch } = await import('../../app/actions/tools');
                const result = await performWebSearch(query);
                return result;
            }
        });
    }
}
