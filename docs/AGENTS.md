# 🤖 Agent Swarm Intelligence

## Overview
Link-OS uses a coordinated **Swarm Architecture** for high-level reasoning and decision-making. Unlike single-agent systems, Link-OS separates concerns into specialized personas that collaborate via a central **Mediator**.

## Core Personas

### 1. The Mediator Agent (`src/kernel/collaboration/MediatorAgent.ts`)
The "Executive" of the swarm. 
- **Role**: Coordinates other agents, detects structural voids in the graph, and performs recursive abstraction.
- **Tools**: Has access to the `ToolRegistry` (e.g., `web_search`, `create_work_node`).
- **Signature**: `performInferenceWithTools(prompt, tier, tools, images?)`.

### 2. The Swarm Orchestrator (`src/kernel/collaboration/SwarmOrchestrator.ts`)
The "Project Manager" that manages the lifecycle of the agents.
- **Context Retrieval**: Uses the `retriever.ts` and `DigestEngine` to feed agents only relevant information.
- **Execution**: Dispatches tasks to the Mediator and handles tool call results.

### 3. Specializations (AgentPersonas)
- **Architect**: Focuses on structural integrity and invariants.
- **Researcher**: Optimized for information retrieval and evidence gathering.
- **Analyst**: Detects contradictions and logistical gaps.

## Agent "Absolute Reality" Flow
1. **Trigger**: A user request or a "Neural Ripple" event activates the Swarm.
2. **Retriever**: `retriever.retrieveContext` fetches a mix of Graph-RAG (Raw nodes) and Crystallized Memory (Digests).
3. **Inference**: The Mediator calls the LLM Gateway using the appropriate `TaskTier`.
4. **Tool Execution**: If the agent decides to use a tool (e.g., `web_search`), it executes a **Server Action** (Wikipedia API) and returns the result to the conversation.
5. **Synthesis**: Results are injected back into the Graph as new `evidence` or `decision` nodes.

## Multi-Modal Reasoning
The agent swarm is natively multimodal. You can pass images (e.g., UI screenshots or diagrams) to the `performInferenceWithTools` function, allowing agents to "see" and reason about visual state.

## Integration Example
```typescript
// Standard Swarm Activation
const { content, toolCalls } = await SwarmOrchestrator.mediator.performInferenceWithTools(
    "Analyze this architecture and suggest improvements.",
    'REASONING',
    availableTools,
    screenshots
);
```
