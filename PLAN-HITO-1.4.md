# PREFLIGHT CHECKLIST: HITO-1.4 The Verifier Logic

> **STATUS**: APPROVED
> **HITO**: 1.4
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`. The Compiler acts "Under Contract".
- [x] **The Path**: Following Hito 1.3 (Receipts).
- [x] **The Stack**: TypeScript/Zod. Using `AssertionMap` as input.

## 2. Objective & Scope
**Goal**: Implementar la lógica del **Verifier**. Este componente toma un `Artifact` (con su `Receipt`) y ejecuta una batería de pruebas automáticas para emitir un `VerificationReport`. Si el reporte falla, el entregable se marca como "Unverified" o se rechaza.

**Scope**:
- [ ] **Schema**: Definir `VerificationReportSchema` (Score, Issues, Pass/Fail).
- [ ] **Logic**: Crear `src/compiler/verifier.ts`.
    - **Check 1 (Structural)**: ¿Todas las aseveraciones en el mapa apuntan a nodos existentes?
    - **Check 2 (Integrity)**: ¿El hash del contexto coincide con el input?
    - **Check 3 (Threshold)**: ¿La confianza promedio de las evidencias supera el umbral configurado?
- [ ] **Pipeline**: Integrar el paso `verify()` al final de `runPipeline`.

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/compiler/verifier.ts`
- `interface VerificationIssue { severity: 'error' | 'warn'; message: string; }`
- `verifyArtifact(artifact: ArtifactNode, context: WorkGraph): VerificationResult`

#### [MODIFY] `src/canon/schema/receipt.ts`
- Añadir `verification_result` al recibo. Queremos que el sello de calidad viaje con el dato.

#### [MODIFY] `src/compiler/index.ts`
- Llamar al Verifier después del Assembler.

### 3.2 Technical Constraints
- [ ] **Deterministic**: El Verificador debe dar siempre el mismo resultado para el mismo input.
- [ ] **Hard Block**: Si hay una violación de Invariante (PIN), el reporte debe ser `FAILED`.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `tests/verifier.test.ts`:
    - **Happy Path**: Un artefacto con assertions válidas pasa la verificación.
    - **Broken Link**: Un artefacto que cita un nodo inexistente falla.
    - **Low Confidence**: Un artefacto basado en evidencias con `confidence: 0.1` genera warnings.

## 5. Definition of Done
- [ ] **Gate**: The Pipeline returns an Artifact that contains a `VerificationReport`.
- [ ] **Evidence**: Tests de lógica de verificación pasando.
