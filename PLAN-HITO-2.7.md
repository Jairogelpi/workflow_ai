# PREFLIGHT CHECKLIST: HITO-2.7 Multi-source Ingestion (The Omni-Ingestor)

> **STATUS**: PENDING
> **HITO**: 2.7
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 2.7.
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## PREFLIGHT CHECKLIST: HITO-2.7 The Omni-Ingestor (Smart & Lossless)

> **STATUS**: DONE
> **HITO**: 2.7
> **MODE**: COMPLETE

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **Decision**: "Ingest All, Filter Later". We store the full artifact first to preserve context integrity.

## 2. Objective & Scope
**Goal**: Construir el sistema de "Ingesta Sin Pérdidas". El usuario puede subir cualquier archivo o texto. El sistema lo guarda en Supabase Storage (The Vault), extrae el texto, lo fragmenta (Chunks) y lo vectoriza (Embeddings) automáticamente.

**Scope**:
- [x] **Storage Vault**: Bucket privado en Supabase para `artifacts/`.
- [x] **Universal Drag&Drop**: Zona de caída en el `GraphCanvas`.
- [x] **The Digester Pipeline**:
    1.  **Upload**: Subida del binario lossless (Gzip).
    2.  **Extract**: OCR/Text extraction (`pdf-parse`, `mammoth`).
    3.  **Chunk**: Dividir en bloques semánticos con overlap.
    4.  **Embed**: Vectorizar para búsqueda (Instant Vectorization).
- [ ] **UX**: Notificaciones "Toast" de progreso (`Uploading` -> `Digesting` -> `Ready`).

## 3. Implementation Plan

### 3.1 Infrastructure (Supabase)
- [x] Crear Bucket `artifacts` con RLS.
- [x] Verificar que `pgvector` está activo.

### 3.2 The Digester Logic (`src/lib/ingest/`)
- [x] **`uploadFile` logic**: SHA-256 deduplication and Gzip compression.
- [x] **`processFile` logic**:
    - Extracción de texto multi-formato.
    - Recursive Chunking (500-1000 tokens).
    - Creación de Nodos Hijos (`type: excerpt`).
    - Relación: `Excerpt -> part_of -> Artifact`.

### 3.3 UI Integration (`src/components/ingest/`)
- [x] **`GlobalDropzone.tsx`**: Invisible dropzone (Refined for batch support).
- [ ] **`IngestStatus.tsx`**: Multi-stage progress feedback.
- [ ] **`SourceNodeView.tsx`**: Advanced view for fragmented artifacts.

## 4. Verification Plan
- [x] **Integrity**: PDF -> extraction -> chunking verified.
- [x] **Graph Topology**: `part_of` edges correctly created.
- [ ] **UX Feel**: Multi-stage toast for heavy documents.
- [x] **Invariant Compliance**: No background scraping; explicit human action required.
- [x] **Traceability**: All imported nodes have source attribution.
- [x] **Cleanliness**: Prettier + ESLint pass.
- [ ] **Assertion Map**: Generated for the final deliverable of this Hito.

---
**Approvals**:
- [ ] **Human Review**: [Signature/Date]
