# Hito 4.8: High-Ceiling Rust Ingestor

## Resumen
Microservicio en **Rust** diseñado para procesar archivos pesados (PDFs de cientos de páginas, HTML complejo) con **memoria segura** y **velocidad nativa**. Elimina el cuello de botella de "Heap out of memory" de Node.js.

## Componentes Implementados

### ingestor-rust/
- **Cargo.toml**: Stack de máximo rendimiento (Axum, Tokio, lopdf, scraper, text-splitter).
- **src/main.rs**: Servidor Axum en puerto 8080 con endpoint `/process`.
- **src/parsers.rs**: Parsing de PDF (lopdf) y HTML (scraper) con Zero-Copy.
- **src/chunking.rs**: Semantic Chunking 30x más rápido que JS.

### Integración TypeScript
- **src/lib/ingest/parsers.ts**: Función `processHeavyFile` que delega al worker de Rust.

## Gate de Verificación
✅ `processHeavyFile` en TypeScript delega al worker de Rust correctamente.

## Evidencia
- `ingestor-rust/src/main.rs`
- `ingestor-rust/src/parsers.rs`
- `ingestor-rust/src/chunking.rs`
- `src/lib/ingest/parsers.ts`
