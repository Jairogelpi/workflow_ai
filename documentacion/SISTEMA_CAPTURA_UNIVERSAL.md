# WorkGraph OS - Sistema de Captura Universal
## Documentación Técnica Completa

> **Fecha**: 2026-01-22  
> **Versión**: Phase 2 Complete  
> **Estado**: Producción

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Phase 2 Enhancements](#phase-2-enhancements)
3. [Sistema de Captura Universal](#sistema-de-captura-universal)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [API Reference](#api-reference)
6. [Guía de Uso](#guía-de-uso)

---

## Visión General

WorkGraph OS ha evolucionado de un editor de grafos a un **sistema de captura y razonamiento universal**. Cualquier conocimiento—texto, archivos, ideas—puede fluir sin fricción hacia el grafo.

### Capacidades Clave

- ✅ **Captura desde LLMs**: ChatGPT, Claude, Gemini
- ✅ **Drag & Drop Universal**: Texto y archivos desde cualquier fuente
- ✅ **BYOK Security**: Claves cifradas cliente-side
- ✅ **Compilación Recursiva**: Subdivisión automática de tareas complejas
- ✅ **Canon Enforcement**: Protección de invariantes (PIN nodes)

---

## Phase 2 Enhancements

### 1. Capture Wedge (Extension)

**Objetivo**: Reducir fricción de entrada.

**Implementación**:
- `extension/src/background/index.ts` - Procesamiento de capturas
- `extension/src/sidepanel/SidePanelViewer.tsx` - UI de previsualización
- `extension/src/content/` - Detectores por plataforma

**Funcionalidades**:
- Context menu con "Open in WorkGraph OS"
- Captura de selección de texto con metadata (URL, título, timestamp)
- Ingesta directa a través de `POST /api/ingest/link`

### 2. Visual Graph

**Objetivo**: Hacer el grafo navegable y filtrable.

**Componentes**:
- `src/components/VisualGraph.tsx` - ReactFlow wrapper
- `src/components/GraphFilters.tsx` - Filtros por estado/tipo

**Features**:
- Visualización de dependencias (`part_of`, `evidence_for`, etc.)
- Filtrado por PIN, Validated, tipo de nodo
- Estilos personalizados por tipo

### 3. Recursive Compilation

**Objetivo**: Manejar objetivos complejos mediante subdivisión.

**Archivos Modificados**:
- `src/compiler/planner.ts` - Lógica recursiva (max depth: 3)
- `src/compiler/retriever.ts` - Retrieval selectivo (Digests vs Raw)
- `src/compiler/assembler.ts` - Uso de contexto optimizado

**Algoritmo**:
```
1. Planner detecta pasos "complex"
2. Llamada recursiva: createPlan(step.description, depth+1)
3. Substeps se anexan al paso padre
4. Retriever usa digests para contexto general, raw para evidencia
```

### 4. BYOK Security

**Objetivo**: Usuario controla sus claves.

**Componentes**:
- `src/lib/security/vault.ts` - AES-GCM encryption (Web Crypto API)
- `src/kernel/security/rate-limiter.ts` - Gestión de cuotas

**Security Model**:
- Claves nunca salen del navegador sin cifrar
- LocalStorage con AES-256-GCM
- PBKDF2 con 100,000 iteraciones
- Salt y IV únicos por instalación

### 5. Canon & Invariants

**Objetivo**: Proteger la verdad.

**Guards Implementados**:
- `canModifyNode()` - Bloquea edición de PIN nodes
- `canDeleteNode()` - Impide borrar nodos con dependientes
- `canAddRelation()` - Prohíbe contradicciones a PIN nodes
- `checkNodeStaleness()` - Detecta nodos obsoletos (>30 días)

**Archivo**: `src/kernel/guards.ts`

---

## Sistema de Captura Universal

### Arquitectura de Detección

```
┌─────────────────────────────────────────┐
│         Content Scripts                 │
│  (Inyectados en páginas específicas)   │
└─────────────────────────────────────────┘
           │
           ├─► ChatGPTDetector
           ├─► ClaudeDetector
           ├─► GeminiDetector
           │
           ▼
┌─────────────────────────────────────────┐
│      BaseFileDetector (Abstract)        │
│  - detect(): DetectedFile[]             │
│  - inject(): void                       │
│  - startObserving(): void               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      Background Service Worker          │
│  - handleFileCapture()                  │
│  - Download file → FormData             │
│  - POST /api/ingest/file                │
└─────────────────────────────────────────┘
```

### Flujo de Captura de Archivos (LLMs)

1. **Detección**: MutationObserver monitorea DOM
2. **Inyección**: Botón "📥 Send to WorkGraph" aparece
3. **Usuario Click/Drag**: Evento capturado
4. **Background Download**: `fetch(file.downloadUrl)`
5. **Upload**: FormData a `/api/ingest/file`
6. **Processing**: `uploadFile()` + `digestFile()` + vectorización

### Text-to-Node Drag & Drop

**Componente Key**: `FloatingPanel.tsx`

**Handlers**:
```typescript
onDragOver={(e) => {
  // Detecta tipo: Files o Text
  setDropState(hasFiles ? 'file' : 'text')
}}

onDrop={(e) => {
  if (files) onFileDrop(files)
  else if (text) onTextDrop(text, sourceUrl)
}}
```

**Visual Feedback**:
- Ring azul alrededor de ventana
- Overlay con icono animado
- "Drop text to create node" / "Drop files here"

**Backend**: `POST /api/nodes/quick`
```json
{
  "content": "Selected text...",
  "source_url": "https://wikipedia.org/...",
  "type": "note" | "idea" | "excerpt"
}
```

---

## Arquitectura Técnica

### Stack

- **Frontend**: Next.js 15, React 19, ReactFlow, TipTap
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + pgvector)
- **Extension**: Chrome MV3, Vite, TypeScript
- **Security**: Web Crypto API (AES-GCM), RLS (Supabase)

### Data Flow

```
┌──────────┐     ┌───────────┐     ┌──────────┐
│ Browser  │────▶│ Extension │────▶│ Backend  │
│ (Drag)   │     │ (Capture) │     │ (Ingest) │
└──────────┘     └───────────┘     └──────────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │ Supabase │
                                    │ (Store)  │
                                    └──────────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │ pgvector │
                                    │(Semantic)│
                                    └──────────┘
```

---

## API Reference

### POST /api/ingest/file
Ingesta de archivos binarios.

**Headers**: `Content-Type: multipart/form-data`

**Body**:
- `file`: File blob
- `platform`: 'chatgpt' | 'claude' | 'gemini' | 'local'

**Response**:
```json
{
  "success": true,
  "nodeId": "uuid",
  "fileName": "document.pdf"
}
```

### POST /api/ingest/link
Ingesta de texto/HTML con metadata.

**Body**:
```json
{
  "url": "https://...",
  "title": "Page Title",
  "content": "Plain text",
  "timestamp": "2026-01-22T16:00:00Z"
}
```

### POST /api/nodes/quick
Creación rápida de nodos desde texto.

**Body**:
```json
{
  "content": "Note content",
  "source_url": "https://...",
  "type": "note",
  "title": "Optional title"
}
```

---

## Guía de Uso

### Para Usuarios

**Captura desde ChatGPT**:
1. Sube un PDF a ChatGPT
2. Click botón "📥 Send to WorkGraph"
3. El archivo aparece en tu grafo

**Drag Text**:
1. Selecciona texto en cualquier web
2. Arrastra a ventana flotante de WorkGraph
3. Suelta → Nodo creado automáticamente

**Drag Files**:
1. Arrastra archivo desde escritorio
2. Suelta en ventana flotante
3. Procesamiento automático

### Para Desarrolladores

**Añadir Nuevo Detector**:
```typescript
export class NewPlatformDetector extends BaseFileDetector {
  detect(): DetectedFile[] {
    // Lógica de detección específica
  }
  
  inject(file, onCapture) {
    // Inyectar UI
  }
}
```

**Registrar en Content Script**:
```typescript
case 'newplatform':
  detector = new NewPlatformDetector();
  break;
```

---

## Próximos Pasos

- [ ] Cloud storage detectors (Notion, Drive, Dropbox)
- [ ] Progress tracking UI para uploads grandes
- [ ] Batch processing interface
- [ ] Preview antes de crear nodo
- [ ] Drag-to-branch (asignar a rama específica)

---

**Mantenido por**: WorkGraph Team  
**Última actualización**: 2026-01-22
