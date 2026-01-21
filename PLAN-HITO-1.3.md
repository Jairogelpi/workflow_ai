# PREFLIGHT CHECKLIST: HITO-1.3 Proof-Carrying Deliverables

> **STATUS**: APPROVED
> **HITO**: 1.3
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: Checked `PROJECT_CHARTER.md`.
- [x] **The Law**: Checked `canon/03_invariants.md`. "No data exists without... immutable origin" and "Every deliverable MUST include an Assertion Map... and Compilation Receipts".
- [x] **The Path**: Following Hito 1.2 (Templates). Next is "Receipts".
- [x] **The Stack**: Strict TypeScript/Zod.

## 2. Objective & Scope
**Goal**: Implementar el sistema de **"Proof-Carrying Data" (PCD)**. Cada entregable generado por el RLM Compiler debe llevar adjunto un "Recibo" criptográfico que certifique CÓMO se creó, QUÉ contexto se usó, y QUÉ afirmaciones (Assertions) contiene.

**Scope**:
- [ ] **Schema**: Definir `ReceiptSchema`, `AssertionMapSchema` en `src/canon/schema/receipt.ts`.
- [ ] **Extension**: Actualizar `ArtifactNode` (o Metadata) para incluir `receipt`.
- [ ] **Logic**: El `Assembler` debe poblar estos recibos automágicamente.
- [ ] **Verification**: Validar que dos ejecuciones idénticas producen el mismo recibo (Idempotencia, salvo timestamps).

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/canon/schema/receipt.ts`
- `Assertion` (Claim ID -> Evidence ID).
- `CompilationReceipt` (Job ID, Timestamp, Input Params Hash, Assertion Map).

#### [MODIFY] `src/canon/schema/ir.ts`
- Extender `ArtifactNode` o `NodeMetadata` para tener un campo opcional `receipt: CompilationReceipt`.
- *Nota: Si esto es disruptivo, se puede añadir como un nodo separado `ReceiptNode` linkeado, pero el Canon dice "Attached". Vamos a integrarlo en ArtifactNode.*

#### [MODIFY] `src/compiler/types.ts`
- Añadir `jobId` al `CompilerContext`.

#### [MODIFY] `src/compiler/assembler.ts`
- Generar el objeto `receipt` usando el contexto y el plan obtenidos.
- Adjuntarlo al Artifact resultante.

### 3.2 Technical Constraints
- [ ] **Zod Enforcement**: Todo validado con Zod.
- [ ] **Traceability**: El `jobId` debe fluir desde el inicio del pipeline.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `tests/receipts.test.ts`:
    - Ejecutar Pipeline.
    - Verificar existencia de `artifact.metadata.receipt`.
    - Verificar que contiene `assertion_map` (aunque esté vacío por ahora si el stub no tiene claims).
- [ ] **Idempotency Check**: Ejecutar el mismo prompt dos veces. Verificar que los hash de inputs sean iguales.

## 5. Definition of Done
- [ ] **Gate**: "Metadata receipts attached to all outputs."
- [ ] **Evidence**: Tests de recibos pasando.
