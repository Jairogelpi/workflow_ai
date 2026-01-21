# PREFLIGHT CHECKLIST: HITO-1.1 Compiler Pipeline

> **STATUS**: APPROVED
> **HITO**: 1.1
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: Phase 0 (Kernel) is DONE. Proceeding to Phase 1 (RLM Compiler).
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Implementar la arquitectura base del **RLM Compiler** (Retrieval-Logic-Manifest). Este "cerebro" orquesta la transformación de una intención de usuario (Prompt) en un entregable estructurado (ArtifactNode).

**Scope**:
- [ ] **1. Planner**: Interfaz para descomponer la intención en pasos lógicos. (Stub inicial).
- [ ] **2. Retriever**: Interfaz para buscar contexto en el WorkGraph (usando dependencias de Hito 0.X).
- [ ] **3. Assembler**: Interfaz para compilar nodos y contexto en un output final.
- [ ] **4. Pipeline**: Orchestrator que conecta estos tres pasos.

**Out of Scope**:
- Lógica compleja de LLM (se usarán stubs deterministas para validar el flujo).
- Integración real con base de datos (se usarán mocks en memoria).

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/compiler/types.ts`
- Definición de interfaces: `CompilerContext`, `Plan`, `RetrievalRequest`, `Manifest`.

#### [NEW] `src/compiler/planner.ts`
- `createPlan(goal: string): Promise<Plan>`

#### [NEW] `src/compiler/retriever.ts`
- `retrieveContext(plan: Plan, graph: WorkGraph): Promise<WorkNode[]>`

#### [NEW] `src/compiler/assembler.ts`
- `assembleArtifact(plan: Plan, context: WorkNode[]): Promise<ArtifactNode>`

#### [NEW] `src/compiler/index.ts`
- `runPipeline(goal: string, graph: WorkGraph): Promise<ArtifactNode>`

### 3.2 Technical Constraints
- [ ] **Stateless**: El pipeline no guarda estado, solo transforma.
- [ ] **Typed**: Uso estricto de `WorkNode` y esquemas definidos en Hito 0.1.
- [ ] **Observable**: Logs de inicio/fin de cada etapa.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `tests/compiler.test.ts`:
    - **Dry Run**: Ejecutar el pipeline con un objetivo "Test Goal".
    - Verificar que los datos fluyen: Planner -> Plan -> Retriever -> Context -> Assembler -> Artifact.
    - Validar que el output final es un `ArtifactNode` válido (Hito 0.1).

## 5. Definition of Done
- [ ] **Gate**: Successful flow from Plan to Assembly (Dry run).
- [ ] **Evidence**: Test de integración "Dry Run" pasando.
- [ ] **Cleanliness**: Lint y tipos estrictos.
