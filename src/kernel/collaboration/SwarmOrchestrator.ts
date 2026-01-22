import { useGraphStore } from '../../store/useGraphStore';
import { MediatorAgent } from './MediatorAgent';
import { TaskComplexity } from '../llm/gateway';
import { retrieveContext } from '../../compiler/retriever';
import { Plan } from '../../compiler/types';
import { ToolRegistry } from '../agency/ToolRegistry';

export type AgentPersonality = 'critic' | 'refiner' | 'expansionist' | 'validator' | 'harvester' | 'librarian';

export interface SwarmAgent {
    id: string;
    name: string;
    personality: AgentPersonality;
    color: string;
}

export class SwarmOrchestrator {
    private static agents: SwarmAgent[] = [
        { id: 'harvester-01', name: 'Neural Harvester', personality: 'harvester', color: '#fbbf24' },
        { id: 'builder-01', name: 'Expansionist', personality: 'expansionist', color: '#22d3ee' },
        { id: 'critic-01', name: 'Logical Critic', personality: 'critic', color: '#f87171' },
        { id: 'validator-01', name: 'Evidence Hunter', personality: 'validator', color: '#c084fc' },
        { id: 'vision-01', name: 'Vision Analyst', personality: 'harvester', color: '#ec4899' },
        { id: 'librarian-01', name: 'G-Librarian', personality: 'librarian', color: '#4ade80' }
    ];
    private static mediator = new MediatorAgent();

    /**
     * Dispatches a thematic pulse to the entire swarm.
     */
    static async dispatchSwarmPulse(contextNodeIds: string[]) {
        const { addRLMThought } = useGraphStore.getState();

        addRLMThought({
            message: `Swarm Pulse Initiated. Context depth: ${contextNodeIds.length} nodes.`,
            type: 'info'
        });

        // Run agents in parallel (Simulated for Hito 14.1 foundation)
        this.agents.forEach(agent => {
            this.runAgentCycle(agent, contextNodeIds);
        });
    }

    private static async runAgentCycle(agent: SwarmAgent, contextNodeIds: string[]) {
        const { addRLMThought, setAgentStatus, nodes, edges } = useGraphStore.getState();

        // Stage 1: Recognition & Contextualization
        setAgentStatus(agent.id, 'THINKING');
        addRLMThought({
            message: `[RECOGNITION] Ingesting semantic context for ${agent.personality} reasoning...`,
            type: 'reasoning',
            agentId: agent.id,
            agentName: agent.name
        });

        // Phase 2.7: Semantic retrieval for agent persona
        const virtualPlan: Plan = {
            goal: `swarm-query-${agent.id}`,
            steps: [{
                id: '1',
                description: `Agent ${agent.name} is looking for ${agent.personality} patterns across the project.`,
                required_context_keys: []
            }]
        };

        const semanticContext = await retrieveContext(virtualPlan, { nodes: nodes as any, edges: edges as any });
        const contextString = JSON.stringify(semanticContext.map((n: any) => ({
            type: n.type,
            content: n.raw || n.digest,
            mode: n.selection_mode
        })));

        try {
            // Stage 2: Neural Inference with Agency (Phase 18)
            const prompt = `Persona: ${agent.name} (${agent.personality})
Context Nodes: ${contextString}
Objective: Perform a specialized analysis or proposal. You have tools available.
Rules: Be concise, technical, and use tools if needed to expand the graph or fetch data.`;

            // Initialize Tools for this cycle
            ToolRegistry.initialize();
            const tools = ToolRegistry.getToolsForLLM();

            // Phase 19: Multimodal detection
            const images = agent.id === 'vision-01'
                ? semanticContext.map((n: any) => n.metadata?.image_url).filter(url => !!url)
                : [];

            const { content, toolCalls } = await (this.mediator as any).performInferenceWithTools(prompt, TaskComplexity.MEDIUM, tools, images);

            setAgentStatus(agent.id, 'WORKING');

            addRLMThought({
                message: content || `[ACTION] Executing ${toolCalls?.length} tools...`,
                type: agent.personality === 'critic' ? 'warn' : 'success',
                agentId: agent.id,
                agentName: agent.name
            });

            // Stage 3: Autonomous Action (Agency Execution)
            if (toolCalls && toolCalls.length > 0) {
                for (const call of toolCalls) {
                    const result = await ToolRegistry.call(call.function.name, JSON.parse(call.function.arguments));
                    addRLMThought({
                        message: `Tool ${call.function.name} executed: ${JSON.stringify(result)}`,
                        type: 'info',
                        agentId: agent.id,
                        agentName: agent.name
                    });
                }
            }
        } catch (error) {
            addRLMThought({
                message: `Neural failure in agent ${agent.name}: ${error}`,
                type: 'error',
                agentId: agent.id,
                agentName: agent.name
            });
        } finally {
            setAgentStatus(agent.id, 'IDLE');
        }
    }
}
