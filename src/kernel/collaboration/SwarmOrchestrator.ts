import { useGraphStore } from '../../store/useGraphStore';
import { MediatorAgent } from './MediatorAgent';
import { TaskComplexity } from '../llm/gateway';

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
        const { addRLMThought, nodes, setAgentStatus } = useGraphStore.getState();

        // Stage 1: Recognition & Contextualization
        setAgentStatus(agent.id, 'THINKING');
        addRLMThought({
            message: `[RECOGNITION] Ingesting context for ${agent.personality} reasoning...`,
            type: 'reasoning',
            agentId: agent.id,
            agentName: agent.name
        });

        const contextNodes = nodes.filter(n => contextNodeIds.includes(n.id));
        const contextString = JSON.stringify(contextNodes.map(n => ({ type: n.data.type, content: (n.data as any).content || (n.data as any).statement })));

        try {
            // Stage 2: Neural Inference (Real LLM Call)
            const prompt = `Persona: ${agent.name} (${agent.personality})
Context Nodes: ${contextString}
Objective: Performe a specialized analysis or proposal based on your personality.
Rules: Be concise, technical, and focused on logical integrity or expansion.`;

            const reasoning = await (this.mediator as any).performInferenceTask(prompt, TaskComplexity.MEDIUM);

            setAgentStatus(agent.id, 'WORKING');

            addRLMThought({
                message: reasoning,
                type: agent.personality === 'critic' ? 'warn' : 'success',
                agentId: agent.id,
                agentName: agent.name
            });

            // Stage 3: Autonomous Action (Hito 15.2 Placeholder)
            if (agent.personality === 'expansionist' && reasoning.includes('PROPOSE_NODE')) {
                addRLMThought({
                    message: "Proposed autonomous expansion projecting via Ghost Nodes.",
                    type: 'info',
                    agentId: agent.id,
                    agentName: agent.name
                });
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
