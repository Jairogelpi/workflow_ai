# Hito 6.4: Stream Assembler

## Resumen
**Generador de documentos de alto volumen** mediante streaming HTTP. Capaz de producir documentos de 500+ páginas sin cargar todo en RAM.

## Arquitectura

### stream-assembler/
- **Cargo.toml**: Dependencias `axum`, `tokio`, `printpdf`, `futures`.
- **src/main.rs**: Servidor Axum con endpoints de ensamblaje.

### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/assemble` | POST | Genera documento completo en memoria |
| `/stream` | POST | Genera documento por chunks (streaming) |

### Formatos Soportados
- **Markdown**: Generación completa con Assertion Map.
- **PDF**: Estructura preparada (stub para integrar `printpdf`).

## Uso desde TypeScript

```typescript
const response = await fetch('http://localhost:8081/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_title: "Informe Anual 2026",
    sections: [
      { title: "Introducción", content: "...", evidence_refs: ["node-1"] },
      // ... 200 secciones más
    ],
    format: "markdown",
    include_assertion_map: true
  })
});

// Procesar stream por chunks
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

## Gate de Verificación
✅ El endpoint de streaming genera documentos incrementalmente.

## Evidencia
- `stream-assembler/src/main.rs`
