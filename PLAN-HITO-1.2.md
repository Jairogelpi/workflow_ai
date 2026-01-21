# PREFLIGHT CHECKLIST: HITO-1.2 Manifest Templates

> **STATUS**: APPROVED
> **HITO**: 1.2
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: Building upon Hito 1.1 (Compiler Pipeline).
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Estandarizar la generación de Artefactos mediante **Templates** rígidos. El Assembler dejará de "inventar" el string final y usará plantillas tipadas para Código, Documentación y Planes.

**Scope**:
- [ ] **Interface**: `ManifestTemplate` (Entrada: Plan+Context, Salida: Markdown/Content).
- [ ] **Templates**:
    - `CodeManifest`: Para generar código fuente.
    - `DocManifest`: Para documentación (Markdown).
    - `PlanManifest`: Para planes de proyecto (como este documento).
- [ ] **Integration**: Actualizar `src/compiler/assembler.ts` para usar templates.

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/compiler/templates/types.ts`
- `interface ManifestTemplate<TData>`
- `createManifest(data: TData): string`

#### [NEW] `src/compiler/templates/code.ts`
- Template para bloques de código con metadatos.

#### [NEW] `src/compiler/templates/doc.ts`
- Template para documentación estructurada (Frontmatter + Markdown).

#### [MODIFY] `src/compiler/assembler.ts`
- Seleccionar template basado en `Plan.goal` o tipo de tarea.

### 3.2 Technical Constraints
- [ ] **Separation of Concerns**: El Template define el formato, el Assembler inyecta los datos.
- [ ] **Reusability**: Los templates deben ser funciones puras.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `tests/templates.test.ts`:
    - Generar un artifact de código usando el template.
    - Generar un artifact de documento.
    - Verificar que el string resultante sigue la estructura esperada (headers, code blocks).
- [ ] `tests/compiler.test.ts`:
    - Verificar que el Pipeline completo ahora usa los templates.

## 5. Definition of Done
- [ ] **Gate**: Assembler uses typed templates instead of raw strings.
- [ ] **Evidence**: Tests de templates pasando.
