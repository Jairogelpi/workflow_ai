# Swarm Intelligence Architecture (v1.0)

> **Status**: Active (Phase 2)
> **Core**: `SwarmOrchestrator` + `AmbientSwarmManager` + `Personas`

## 1. Introduction
The "Swarm" is a collection of specialized AI Agents that collaborate to evolve the WorkGraph. Unlike a single chat bot, these agents operate autonomously in the background or on-demand.

## 2. Agent Registry (The Team)
Defined in `src/kernel/collaboration/Personas.ts`.

| Agent | Role | Capabilities |
| :--- | :--- | :--- |
| **Mediator** (The Leader) | Strategy & Routing | Decides *which* agent should act next. Detects structural voids. |
| **Harvester** (The Scraper) | Browsing & Facts | Uses `tools.ts` to fetch Wikipedia/Web data and verify claims. |
| **Critic** (The Judge) | Logic & Validation | Checks for contradictions (PINs) and logical fallacies. |
| **Analyst** (The Quant) | Data & Patterns | Analyzes density, identifying patterns in large graphs. |
| **Producer** (The Writer) | Synthesis | Compiles PRDs and Documents via `ProductEngine`. |

## 3. The Activation Loop

### A. Manual Pulse ("Activar Enjambre")
1. **User Trigger**: Button in `IngestionHUD`.
2. **Context**: Sends currently visible node IDs to `SwarmOrchestrator.dispatchSwarmPulse()`.
3. **Orchestrator**:
   - Aggregates context.
   - Calls **Mediator** to plan a "Swarm Strategy".
   - Dispatches tasks to sub-agents (e.g., "Harvester, verify this claim").
   - Agents return `ChangeProposal`s.
   - **ConsensusEngine** validates proposals.
   - **MergeEngine** applies changes.

### B. Ambient Pulse (Autonomous)
Managed by `AmbientSwarmManager.ts`.
- **Trigger**: Listens to Zustand store changes (Nodes Added/Edges Created).
- **Debounce**: Runs max once every 5 seconds.
- **Action**: If sufficient change is detected, triggers a mini-pulse to keep the graph "alive".

## 4. Tool Usage (The Hands)
Agents can use "Real World Tools" defined in `src/app/actions/tools.ts`.
- **`performWebSearch`**: Live Wikipedia/Search API access.
- **`retrieveContext`**: Internal Graph-RAG lookup.

## 5. Security
- **Sandboxed Execution**: Agents cannot directly mutate the DB. They submit *Proposals*.
- **Consensus Gate**: Proposals are rejected if they violate PIN invariants (SAT Solver).
