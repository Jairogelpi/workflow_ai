# HITO 2.7 SUMMARY: The Omni-Ingestor (Smart & Lossless)

> **STATUS**: COMPLETED (Ultimate Edition)
> **TIMESTAMP**: 2026-01-22
> **VERSION**: 2.0.0 (LOSSLESS CORE)

## 1. El Objetivo Cumplido
Hemos transformado el WorkGraph OS en un **"Digital Digestive System"** de nivel Arquitecto 2026. El sistema ha pasado de ser un simple gestor de archivos a un motor de ingesta inteligente que preserva la integridad de los datos (`Lossless`) mientras los prepara para la potencia del RLM Compiler (`Smart`).

## 2. Technical Stack & Architecture

### A. The Lossless Vault (Supabase Storage)
- **Deduplication**: SHA-256 hashing para evitar almacenamiento redundante.
- **Compression**: Gzip automático para todos los archivos >1KB (ahorro masivo de costes).
- **Integrity**: El archivo original se mantiene intacto y el nodo `source` guarda su `hash` para verificación perpetua.

### B. The Digestive Pipeline (Server Actions)
1. **Extraction**: Parsers blindados para PDF, DOCX, XLSX, JSON y Código.
2. **Recursive Chunking**: División del texto en bloques de 500-1000 tokens con overlap semántico.
3. **Vectorization**: Indexación inmediata en `pgvector` (`node_embeddings`) vinculada a los fragmentos.

### C. IR Schema Extension
- **Node `source`**: El contenedor raíz LOSSLESS.
- **Node `excerpt`**: Fragmentos de conocimiento individuales.
- **Relation `part_of`**: Eje jerárquico que une los fragmentos con su origen.

## 3. UX Perfection (Interface)
- **Multi-Stage Feedback**: El `GlobalDropzone` informa del estado exacto: `Uploading` -> `Digesting` -> `Ready`.
- **SourceNodeView**: Nueva vista especializada que permite navegar por los "Knowledge Chunks" y descargar el binario original mediante URLs firmadas.
- **Zero-Block UX**: El procesamiento ocurre de forma asíncrona y no bloqueante para el grafo.

## 4. Evidence List
- [x] **Core Service**: `src/lib/ingest/index.ts`
- [x] **Engine**: `src/lib/ingest/chunking.ts`
- [x] **Enrichment**: `src/lib/ingest/vectorizer.ts`
- [x] **Component**: `src/components/editor/SourceNodeView.tsx`
- [x] **Schema**: `src/canon/schema/ir.ts` (Extensiones de `excerpt` y `part_of`)

## 5. Result
**Total Knowledge Control**. El usuario puede tirar cualquier PDF o código al sistema y tenerlo listo para el compilador en segundos, sin perder el archivo original y con una navegación fragmentada de alta precisión.
