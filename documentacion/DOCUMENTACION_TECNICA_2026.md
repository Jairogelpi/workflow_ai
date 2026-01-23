# WorkGraph OS: Manual Técnico & Arquitectura 2026

## 🌟 Visión del Producto
**WorkGraph OS** no es un gestor de archivos. Es un **Sistema Operativo Cognitivo** diseñado para transformar el trabajo de conocimiento en un grafo semántico inviolable, colaborativo y mediado por IA.

El sistema garantiza:
1.  **La Verdad Inmutable**: A través de `Verifier.ts` y nodos PIN.
2.  **Colaboración sin Miedo**: Mediante consenso negociado por IA (`MediatorAgent v3.0`).
3.  **Memoria Infinita**: Usando `Digests` jerárquicos y RAG semántico.
4.  **Transparencia Radical**: Percepción X-Ray y auditoría forense en tiempo real.

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
- **Negotiator / MediatorAgent v3.0**: Inteligencia diplomática. Realiza "Pulses" de inferencia para detectar vacíos lógicos y propone cambios estructurales (Ghost Nodes/Drafts).
- **Recursive Abstraction**: Compresión de clústeres de evidencia en artefactos de alto nivel (Digests).
- **Change Requests**: El vehículo de cambio, almacenado en DB con reportes de análisis JSONB.

#### C. Ingestion Layer (`src/lib/ingest`)
- Procesamiento inteligente de PDFs, Excel e Imágenes.
- **LinkOS Extension (X-Ray Percept)**: Captura contexto del navegador mediante "Ambient Scanning" e iluminación semántica por categoría.
- **SidePanelViewer.tsx**: Interfaz de pre-visualización y validación rápida.

#### D. Performance & Security (Production 2026)
- **Antigravity Engine (`antigravity-engine/`)**: Motor de física de grafos en **Rust (WebAssembly)**. Procesa cálculos vectoriales a 60 FPS sin bloquear el hilo de UI.
- **Smart Router (`src/kernel/llm/gateway.ts`)**: Inteligencia financiera. Selecciona el modelo óptimo (GPT-5, Gemini 3 Flash, DeepSeek) basado en el **Price Registry 2026** y la complejidad de la tarea.
- **The Vault (`src/lib/security/vault.ts`)**: Bóveda de secretos BYOK con cifrado AES-GCM (E2EE). Las claves API nunca se guardan en texto plano.
- **Privacy Guardian (`src/kernel/guards.ts`)**: Sanitización automática de logs y trazas (Redacción de claves API).

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

### 3. Editor Semántico & Forensic UX
Interfaz basada en grafos (Nodes) y texto rico, donde cada párrafo es un nodo direccionable.
- **Modo X-Ray (Alt)**: Visualización de "cables lógicos" (Assertion Map) y HUD forense con métricas de coste y latencia real.
- **Audit Trail**: Trazabilidad absoluta desde el artefacto final hasta la evidencia original en el Canon.
- **Authority Seal**: Interacción de "Alta Fricción" (Hold-to-Seal 1.5s) para firmar la verdad inmutable en el Canon, bloqueando el nodo contra ediciones no autorizadas.

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

*Documentación actualizada para el despliegue Hito 4.8 - Rust Engine, Smart Routing & Vault.*

---

## 🦀 Phase 6: Advanced Rust Core (Enterprise Grade)

Para alcanzar la "perfección técnica", el sistema incluye cuatro módulos nativos en Rust:

### A. Authority Signer (Ed25519)
Firmas criptográficas para autoría humana verificable. Cada nodo PIN puede ser firmado con la clave privada del usuario, garantizando trazabilidad inmutable.

### B. Logic SAT Solver
Motor de resolución de restricciones SAT (varisat) para verificar consistencia de PINs en grafos masivos. Detecta contradicciones y dependencias rotas en milisegundos.

### C. CRDT Sync Engine
Colaboración en tiempo real sin conflictos usando Yrs (Yjs para Rust). Permite que múltiples usuarios editen el mismo nodo simultáneamente.

### D. Stream Assembler
Generador de documentos de 500+ páginas mediante streaming HTTP. No carga todo el documento en RAM, permitiendo exportaciones masivas.

**Evidencia**: `signer-core/`, `logic-engine/`, `crdt-sync/`, `stream-assembler/`

---

## ⚡ Phase 10: Resource Optimization (Efficiency Mastery)

Para maximizar el rendimiento y minimizar el consumo de recursos (RAM/CPU), hemos consolidado la arquitectura:

- **Unificación en Rust**: El microservicio de Python (`rlm-core`) ha sido migrado íntegramente a Rust y fusionado con el `ingestor` y el `assembler`.
- **WorkGraph Worker**: Un único binario de alto rendimiento gestiona la ingesta de archivos, el ensamblaje de documentos y la verificación lógica local.
- **Reducción de Footprint**: Eliminación del runtime de Python, ahorrando ~200MB de RAM por instancia y reduciendo la latencia de red entre servicios.
- **Docker Optimizado**: El stack se ha simplificado a 3 servicios core (`main-app`, `workgraph-worker`, `ollama`).

**Evidencia**: `workgraph-worker/`, `docker-compose.yml`

---

## 🌀 Phase 21: Zero-Friction Sensoriality (The Experience)

Hemos elevado el sistema a una **Extensión Neural** mediante retroalimentación sensorial de alta fidelidad:
- **Spatial Magnetism**: Los nodos del grafo responden dinámicamente a la proximidad del cursor mediante el motor de física Rust, creando una interacción orgánica.
- **Neural Ripple**: Ondas de choque visuales en el background que confirman las acciones del enjambre de forma no intrusiva.
- **CommandHUD (Cmd+K)**: Acceso instantáneo y "telepático" a cualquier rincón de la red de conocimiento.

## 🖥️ Phase 22: OS Metamorphosis (Second Brain Shell)

WorkGraph ha dejado de ser una web para convertirse en un **Entorno Operativo**:
- **Desktop Shell & System Dock**: Una interfaz de escritorio con barra de sistema y dock dinámico para la gestión de aplicaciones internas.
- **WindowManager v2 (Infinity Stack)**: Soporte multiventana real con gestión de profundidad (`zIndex`) y foco, permitiendo flujos de trabajo paralelos.
- **Minimalist "Neural Google" Design**: Lenguaje visual ultra-limpio diseñado para maximizar la claridad mental y reducir el ruido cognitivo.

**Evidencia**: `src/components/shell/`, `src/components/ui/WindowManager.tsx`, `src/components/ui/BootSequence.tsx`

---

## 🛡️ Phase 7: Sovereign Intelligence Layer

La capa de inteligencia soberana asegura que el grafo se auto-repare, valide mutaciones en tiempo real y ofrezca transparencia total.

### A. Self-Healing Engine (Hito 7.8)
Motor híbrido SAT (Rust) + RLM (Python/TS) para detección y reparación de inconsistencias:
- **Alignment Engine**: Orquestador de alineación entre visión estratégica y ejecución.
- **Ghost Nodes**: Proyecciones visuales de gaps lógicos, materializables con firma Ed25519.
- **AlignmentOverlay/Tunnels**: HUD forense para visualización de conexiones y brechas.

### B. Sync Coherence Agent (Hito 7.9)
Guardián de mutaciones que intercepta cada cambio antes de persistencia:
- **SyncGuardian**: Valida con SAT Solver, sincroniza con CRDT.
- **Sensory Ripple**: Feedback visual de pantalla completa (Rojo=Error, Cian=OK).
- **Shadow Audit**: Re-evaluación semántica no bloqueante para cambios significativos.

### C. Forensic Audit Mode / X-Ray Vision (Hito 7.10)
Transparencia radical para inspección del razonamiento de la IA:
- **ForensicAuditView**: Panel flotante con métricas de sesión (Spend, Burn Rate, Integrity).
- **XRayOverlay**: Burbujas de razonamiento por nodo (Confianza %, Costo, Firma).
- **Circuit Breaker**: Botón de emergencia para detener comunicación con LLMs.

### D. Sovereign Onboarding (Hito 7.11 / 4.1)
Flujo de inicialización de proyectos con gobernanza RBAC:
- **ProjectManifest**: HUD de alta fidelidad para definición de intención y roles.
- **BootSequence**: Secuencia de arranque inmersiva con ondas "Neural Ripple".
- **RLMDispatcher/Compiler**: Autogeneración de arquitecturas de pensamiento.
- **Guards RBAC**: Soberano (Admin), Arquitecto (Editor), Observador (Viewer).

**Evidencia**: `src/kernel/alignment_engine.ts`, `src/kernel/SyncGuardian.ts`, `src/hooks/useXRayMode.ts`, `src/components/graph/ForensicAuditView.tsx`, `src/components/collaboration/ProjectManifest.tsx`, `src/kernel/RLMDispatcher.ts`

---

*WorkGraph OS: Consciousness is the Interface. Professional Grade 2026.*
