# WorkGraph OS: Manual de Usuario Maestro (v2026.1)

> **Este documento sirve como la Fuente de Verdad Operativa y Validación de Cumplimiento del Roadmap 2026.**
> *Estado del Sistema: 100% Operativo (Zero-Mock).*

---

## 📚 Índice
1.  [Introducción: El Sistema Operativo Cognitivo](#1-introducción-el-sistema-operativo-cognitivo)
2.  [Nivel 1: Fundamentos (Lo Básico)](#2-nivel-1-fundamentos-lo-básico)
3.  [Nivel 2: La Cuña (Captura Universal)](#3-nivel-2-la-cuña-captura-universal)
4.  [Nivel 3: El Cerebro (Inteligencia Soberana)](#4-nivel-3-el-cerebro-inteligencia-soberana)
5.  [Nivel 4: Núcleo Empresarial (Seguridad y Auditoría)](#5-nivel-4-núcleo-empresarial-seguridad-y-auditoría)
6.  [Nivel 5: El Enjambre (Swarm Architecture)](#6-nivel-5-el-enjambre-swarm-architecture---fases-14-16)
7.  [Nivel 6: Percepción Total (Fases 19-22)](#7-nivel-6-percepción-total-fases-19-22)
8.  [Nivel 7: Zero-Mock & Verdad Absoluta](#8-nivel-7-zero-mock--verdad-absoluta-fase-26)
9.  [Anexo: Matriz de Validación del Roadmap](#9-anexo-matriz-de-validación-del-roadmap)

---

## 1. Introducción: El Sistema Operativo Cognitivo

WorkGraph OS no es una herramienta de notas. Es una extensión de tu mente que convierte información dispersa en **Estructura Ejecutable**.

A diferencia de ChatGTP (que es efímero) o Notion (que es estático), WorkGraph utiliza un **Recursive Logic Model (RLM)** para verificar, conectar y aumentar tu conocimiento, asegurando que nada se pierda y todo esté conectado lógicamente.

---

## 2. Nivel 1: Fundamentos (Lo Básico)

### 2.1 La Interfaz "Neural"
Al iniciar (`npm run dev`), te encontrarás con el **Lienzo Infinito (Infinite Canvas)**.
*   **El Grafo**: Tu espacio de trabajo visual. Los círculos son **Nodos** (ideas, datos), las líneas son **Aristas** (relaciones).
*   **Barra Lateral (Sidebar)**: Tu explorador de archivos y búsqueda semántica (Hito 2.4).
*   **Paneles Flotantes**: Ventanas estilo "Minority Report" para multitarea (Hito 2.8).

### 2.2 Acciones Básicas
1.  **Crear un Nodo**:
    *   Haz doble clic en cualquier lugar vacío del lienzo.
    *   Escribe tu idea. El sistema detectará automáticamente si es una `Afirmación`, `Evidencia` o `Tarea`.
2.  **Conectar Ideas**:
    *   Arrastra desde el borde de un nodo hacia otro.
    *   Selecciona el tipo de relación: `Soporta`, `Refuta` o `Relaciona`.
    *   *Nota*: El **Motor de Física Rust** (`antigravity-engine`) organizará los nodos orgánicamente a 60 FPS (Hito 4.7).

### 2.3 Persistencia
No necesitas guardar. El sistema utiliza **Supabase** con sincronización `CRDT` (Hito 2.5), lo que significa que tus datos viven en la nube y se sincronizan en tiempo real entre colaboradores.

---

## 3. Nivel 2: La Cuña (Captura Universal)

El objetivo es capturar información sin fricción desde cualquier fuente.

### 3.1 Drag & Drop Inteligente (Hito 5.2)
Arrastra cualquier texto o archivo desde tu escritorio o navegador directamente al lienzo.
*   **Archivos**: PDFs, Imágenes, Excel. El **Ingestor Rust** (`ingestor-rust`) procesará archivos pesados en milisegundos (Hito 4.8).
*   **Texto**: Se convierte instantáneamente en un Nodo.

### 3.2 Extensión Link-OS (Hito 3.4)
Usa la extensión de Chrome para enviar páginas web al grafo.
*   El sistema no solo guarda el link, sino que lee el contenido, lo resume ("Digest") y lo vectoriza para búsqueda futura.

---

## 4. Nivel 3: El Cerebro (Inteligencia Soberana)

Aquí es donde WorkGraph "piensa" por ti.

### 4.1 Generación de Documentos (RLM Compiler - Hito 1.x)
Transforma tu grafo en entregables lineales (Informes, Pasos a paso).
1.  Selecciona un nodo raíz.
2.  Haz clic en "Generar Artefacto".
3.  El **Pipeline RLM** (Planificador -> Recuperador -> Ensamblador) redactará un documento completo basado SÓLO en la evidencia conectada.

### 4.2 El Mediador (Colaboración IA - Hito 3.6)
Cuando colaboras con otros:
*   Si tú dices "A es Cierto" (PIN) y tu colega dice "A es Falso".
*   El **MediatorAgent v3.0** detectará el conflicto lógico.
*   Te presentará una **Mesa de Negociación** con argumentos para resolver la disputa antes de permitir la fusión.

### 4.3 Smart Routing (Economía - Hito 4.9)
El sistema decide qué modelo de IA usar para ahorrar dinero.
*   **Tareas Simples**: Usa modelos rápidos y baratos (e.g., GPT-4o-mini).
*   **Razonamiento Profundo**: Usa modelos potentes (e.g., o1, Claude 3.5 Sonnet).
*   Esto se gestiona en `src/kernel/llm/gateway.ts`.

---

## 5. Nivel 4: Núcleo Empresarial (Seguridad y Auditoría)

Para entornos profesionales que requieren "Verdad Criptográfica".

### 5.1 Modo Rayos-X (Forensic UX - Hito 7.10)
Presiona `Alt` (o activa el toggle "X-Ray") para ver la realidad desnuda del sistema.
*   **Cables Lógicos**: Verás las conexiones ocultas de validación.
*   **Panel Forense**: Muestra cuánto costó cada pensamiento de la IA, la latencia y la confianza.
*   **Circuit Breaker**: Un botón rojo para cortar la conexión con la IA en caso de emergencia.

### 5.2 La Bóveda (Vault - Hito 4.10)
Tus claves API (OpenAI, Anthropic) nunca se guardan en texto plano en la base de datos.
*   Se cifran con **AES-GCM** en el cliente.
*   Solo se descifran en la memoria RAM durante el milisegundo que dura la llamada a la API (`JIT Decryption`).

### 5.3 Motores Rust (Performance Extrema - Hito 6.x)
El núcleo pesado del sistema corre sobre **Rust** y **WebAssembly**:
*   `logic-engine`: Resuelve conflictos lógicos matemáticamente (SAT Solver).
*   `crdt-sync`: Sincronización de datos indestructible.
*   `signer-core`: Firmas digitales criptográficas (Ed25519) para probar que un humano (y no una IA) creó un nodo crítico.

---

## 6. Nivel 5: El Enjambre (Swarm Architecture - Fases 14-16)

Más allá de un simple chatbot, WorkGraph opera como un organismo de múltiples agentes autónomos.

### 6.1 Dashboard del Enjambre (Neural HUD - Hito 15.1)
Visualiza la actividad cerebral del sistema en tiempo real.
*   **Agentes Especializados**: Verás íconos para `Harvester` (Recolector), `Expansionist` (Creativo), `Critic` (Auditor) y `Librarian` (Organizador).
*   **Pulso del Sistema**: Monitor de latencia y estado de red "Vivo" (Hito 15.1).

### 6.2 Conciencia Ambiental (Hito 16.1)
El sistema "escucha" los cambios en el grafo sin tu intervención.
*   Si dejas un nodo incompleto, el **Ambient Swarm** puede sugerir conexiones o completarlo silenciosamente si tiene confianza alta (Zero-Click Reasoning).

---

## 7. Nivel 6: Percepción Total (Fases 19-22)

### 7.1 Visión Multimodal (The Eye - Hito 19.x)
El sistema puede "ver" diagramas y esquemas.
*   Sube una imagen de una arquitectura de software.
*   El **Vision Analyst Agent** deconstruirá los componentes y creará nodos para cada servidor o base de datos detectada.

### 7.2 Física de Cero-Copia (Phase 22)
La interfaz se siente "biológica" gracias al motor de física optimizado.
*   **Magnetismo Espacial**: Los nodos reaccionan a la proximidad de tu cursor.
*   **Rendimiento 60FPS**: Incluso con miles de nodos, gracias a la transferencia de memoria directa (`Float32Array`) entre el hilo principal y el Worker de física.

---

### 7.3 Interfaz Telepática (Hito 21.2)
Accede a todo el poder del sistema sin tocar el ratón.
*   Presiona `Cmd+K` (o `Ctrl+K`) para abrir el **Command HUD**.
*   Busca nodos, ejecuta comandos de enjambre (`/heal`, `/pulse`) y navega instantáneamente.

### 7.4 Protocolo de Herramientas (Hito 18.1)
Los agentes no son solo chat; tienen manos.
*   El `ToolRegistry` permite a los agentes crear nodos reales, buscar en la web y modificar la estructura del grafo de forma autónoma.

---

## 8. Nivel 7: Zero-Mock & Verdad Absoluta (Fase 23-26)

El sistema ha evolucionado hacia un **Hypervisor de Verdad Absoluta**.
*   **Dynamic Axiom Pool**: Las reglas del sistema no están "hardcodeadas" en el código, sino que viven como Nodos PIN en la base de datos.
*   **Economía Cognitiva Circular**: El sistema reutiliza razonamientos previos ("Antibodys") para evitar errores futuros sin reentrenamiento.
*   **Vectores Unificados**: Todo (texto, código, imagen) vive en el mismo espacio matemático (768 dimensiones).

---

## 9. Anexo: Matriz de Validación del Roadmap

A continuación se certifica el cumplimiento del Roadmap 2026. Todos los puntos marcados como **[IMPLEMENTADO Y FUNCIONAL]** han sido verificados en el código fuente.

| Fase | Hito | Descripción | Estado | Evidencia en Código |
| :--- | :--- | :--- | :--- | :--- |
| **0. Kernel** | 0.1 - 0.3 | Esquema IR, Versionado Hash, Nodos PIN | ✅ IMPLEMENTADO | `src/canon/schema/ir.ts`, `src/kernel/versioning.ts` |
| **1. Compiler** | 1.1 - 1.4 | Pipeline RLM (Planner, Retriever, Assembler) | ✅ IMPLEMENTADO | `src/compiler/index.ts`, `src/compiler/verifier.ts` |
| **2. Capture** | 2.1 - 2.5 | UI Grafo, Store Tipado, Persistencia SQL | ✅ IMPLEMENTADO | `src/store/useGraphStore.ts`, `supabase/migrations/init.sql` |
| **2. Capture** | 2.6 - 2.7 | Extensión Chrome, Ingesta Vectorial | ✅ IMPLEMENTADO | `extension/`, `src/lib/ingest/vectorizer.ts` |
| **2. Capture** | 2.8 | Window Manager (Paneles Flotantes) | ✅ IMPLEMENTADO | `src/components/ui/FloatingPanel.tsx` |
| **3. Scaling** | 3.1 - 3.2 | Digests Jerárquicos, Detección obsolescencia| ✅ IMPLEMENTADO | `src/kernel/digest_engine.ts` |
| **3. Scaling** | 3.3, 4.9 | Dynamic Pricing & Smart Routing | ✅ IMPLEMENTADO | `src/kernel/llm/gateway.ts` (SmartRouter) |
| **3. Scaling** | 3.5 - 3.6 | Identidad, RLS, Colaboración Mediada | ✅ IMPLEMENTADO | `src/kernel/collaboration/MediatorAgent.ts` |
| **4. Enterprise**| 4.1, 7.11 | Onboarding Soberano, RBAC | ✅ IMPLEMENTADO | `src/components/graph/BootSequence.tsx`, `guards.ts` |
| **4. Enterprise**| 4.3, 7.10 | Forensic UX, X-Ray Mode, Audit View | ✅ IMPLEMENTADO | `src/components/graph/ForensicAuditView.tsx` |
| **4. Enterprise**| 4.7 | **Antigravity Engine (Rust)** | ✅ IMPLEMENTADO | `antigravity-engine/src/lib.rs` |
| **4. Enterprise**| 4.8 | **Rust Ingestor Service** | ✅ IMPLEMENTADO | `ingestor-rust/src/main.rs` |
| **4. Enterprise**| 4.10 | Vault Security (BYOK Cifrado) | ✅ IMPLEMENTADO | `src/lib/security/vault.ts` |
| **6. Rust Core** | 6.1 - 6.4 | Signer, Logic SAT, CRDT Sync, Streamer | ✅ IMPLEMENTADO | `signer-core/`, `logic-engine/`, `crdt-sync/` |
| **7. Sovereign** | 7.8 - 7.9 | Self-Healing, Sync Guardian | ✅ IMPLEMENTADO | `src/kernel/alignment_engine.ts`, `SyncGuardian.ts` |
| **12-16. Swarm** | 12.x - 16.x | Ghost Nodes, Swarm Dashboard, Ambient | ✅ IMPLEMENTADO | `src/components/ui/SwarmDashboard.tsx` |
| **19. Vision**   | 19.1 - 19.2 | Multimodal Vision Analyst | ✅ IMPLEMENTADO | `src/kernel/llm/gateway.ts` (Vision Adapter) |
| **20-22. Real**  | 20.x - 22.x | Inter-Swarm, Magnetismo, Zero-Copy Phys| ✅ IMPLEMENTADO | `src/hooks/useAntigravityEngine.ts` |
| **Power User**   | 18.1, 21.2| **Cmd+K HUD**, Tool Registry | ✅ IMPLEMENTADO | `src/components/ui/CommandHUD.tsx`, `ToolRegistry.ts` |
| **26. ZeroMock** | 26.1 - 26.3 | Dynamic Axioms, Production Retriever | ✅ IMPLEMENTADO | `src/compiler/retriever.ts` |

**Conclusión Final:**
El sistema WorkGraph OS cumple con la totalidad de los hitos críticos definidos en el Roadmap, con una arquitectura híbrida (TypeScript + Rust) totalmente desplegada y funcional en su base de código.
