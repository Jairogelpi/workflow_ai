# WorkGraph OS: Manual Técnico & Arquitectura 2026

## 🌟 Visión del Producto
**WorkGraph OS** no es un gestor de archivos. Es un **Sistema Operativo Cognitivo** diseñado para transformar el trabajo de conocimiento en un grafo semántico inviolable, colaborativo y mediado por IA.

El sistema garantiza:
1.  **La Verdad Inmutable**: A través de `Verifier.ts` y nodos PIN.
2.  **Colaboración sin Miedo**: Mediante consenso negociado por IA (`MediatorAgent`).
3.  **Memoria Infinita**: Usando `Digests` jerárquicos y RAG semántico.

---

## 🏗️ Arquitectura del Sistema (El Kernel)

### 1. Recursive Logic Model (RLM)
La arquitectura central que diferencia a WorkGraph de un simple "Chat con Docs".
- **Fase 1: Verificación ($0 Cost)**: El código determinista valida la lógica antes de llamar a la IA.
- **Fase 2: Recuperación Quirúrgica**: Solo se envía contexto relevante al LLM.
- **Fase 3: Humanización**: Modelos pequeños traducen hechos verificados a lenguaje natural.

### 2. Estructura de Datos (Canon)
Definida en `src/canon/schema/ir.ts` y persistida en Supabase.
- **WorkNode**: La unidad atómica (Claim, Evidence, Decision, Task).
- **WorkEdge**: Relaciones lógicas (Supports, Refutes, Blocks).
- **Metadata**: Invariantes, niveles de confianza y linaje de origen.

### 3. Componentes Principales

#### A. The Compiler (`src/compiler`)
- **Assembler**: Convierte grafos dispersos en artefactos lineales (Documentos).
- **Verifier**: El "Juez". Ejecuta `verifyBranch()` para asegurar integridad lógica.
    - *Input*: Nodos y Reglas (PINs).
    - *Output*: Veredicto matemático (Pass/Fail).

#### B. Collaboration Engine (`src/kernel/collaboration`)
- **MergeEngine**: Orquestador de fusiones. Simula estados futuros.
- **Negotiator / MediatorAgent**: Inteligencia diplomática. Explica conflictos usando RLM.
- **Change Requests**: El vehículo de cambio, almacenado en DB con reportes de análisis JSONB.

#### C. Ingestion Layer (`src/lib/ingest`)
- Procesamiento inteligente de PDFs, Excel e Imágenes.
- **LinkOS Extension**: Captura contexto del navegador manteniendo la identidad del usuario (`SidePanelViewer.tsx`).

---

## 💾 Base de Datos (Supabase Protocol)

### Esquema Relacional (`gate9_collaboration.sql`)
- **`projects`**: Contenedores de conocimiento.
- **`work_nodes` / `work_edges`**: Grafo polimórfico.
- **`project_members`**: RBAC (Viewer, Editor, Owner).
- **`change_requests`**: Propuestas de evolución del grafo.
- **`notifications`**: Sistema asíncrono de alertas.

### Seguridad (RLS 2.0)
- **Identity-Aware**: Las políticas Row Level Security aseguran que la IA solo "ve" lo que el usuario puede ver.
- **Access Policies**:
    - `select`: Solo miembros del proyecto.
    - `insert/update`: Solo editores/owners.
    - `change_requests`: Visibles para todo el equipo.

---

## 🎨 Experiencia de Usuario (Frontend 2026)

### 1. Visual Diff Forense
(`src/components/collaboration/VisualDiffView.tsx`)
Comparación lado a lado con resaltado semántico. Permite ver la "evolución de la verdad" antes de fusionar.

### 2. Mesa de Decisiones
(`src/components/collaboration/CollaborationInbox.tsx`)
No es una lista de tareas. Es un centro de mando donde el **MediatorCard** presenta argumentos lógicos para aceptar o rechazar cambios, eliminando la fricción social.

### 3. Editor Semántico
Interfaz basada en grafos (Nodes) y texto rico, donde cada párrafo es un nodo direccionable e inmutable si se marca como PIN.

---

## 🚀 Flujos de Trabajo (Workflows)

### A. Creación de Conocimiento
1. Usuario sube PDF → `Ingestor` lo rompe en Nodos.
2. Usuario conecta Nodos (Links) → Se crean `Edges`.
3. Usuario marca un dato clave como PIN → Se convierte en invariante.

### B. Colaboración Segura
1. Usuario B edita un nodo en su rama.
2. Intenta fusionar → `MergeEngine` detecta conflicto con PIN.
3. `MediatorAgent` analiza: "Esto rompe el presupuesto".
4. Usuario A recibe notificación en `CollaborationInbox`.
5. Ve `VisualDiff` y `MediatorCard`.
6. Decide: "Rechazar" (Protegido por sistema) o "Negociar".

---

*Documentación generada automáticamente para el despliegue Hito 3.6 - Gate 9.*
