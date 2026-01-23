# Hito 4.1: Sovereign Onboarding (Project Initialization & RBAC)

## Descripción
El flujo de "Onboarding Soberano" permite a los usuarios definir la intención y gobernanza de un proyecto antes de que el RLM autogenere una estructura de plan consistente.

## Componentes Implementados

### UI
- **`ProjectManifest.tsx`**: HUD de alta fidelidad para definición de proyecto.
  - Campo de intención (Canon Purpose).
  - Tabla de asignación de roles (RBAC).
  - Estética forense: Slate-950, Neon Cyan, monospace.
- **`BootSequence.tsx`**: Secuencia de arranque inmersiva con ondas "Neural Ripple".
- **`WindowManager.tsx`**: Integración del Manifest como contenido de ventana flotante.

### Kernel
- **`RLMDispatcher.ts`**: Orquestador de generación automática de arquitecturas.
- **`RLMCompiler.ts`**: Descomposición semántica de intenciones en "Pilares" (ramas).
- **`planner.ts`**: Utilidades de bajo nivel para creación de ramas y nodos.
- **`guards.ts`**: Restricciones RBAC refinadas:
  - **Soberano (Admin)**: Control absoluto, incluyendo PINs.
  - **Arquitecto (Editor)**: Autocompletado, no puede tocar PINs.
  - **Observador (Viewer)**: Solo lectura + acceso a Forensic HUD.

### Store
- **`useGraphStore.ts`**:
  - Estado `projectManifest` y `isBooting`.
  - Acción `initProjectSwarm` conectada al `RLMDispatcher`.
  - Acción `openManifest` para auto-apertura en carga.

## Flujo de Operación
1. Al cargar el grafo, se verifica si existe un `projectManifest`.
2. Si no existe, se abre automáticamente el `ProjectManifest` en el `WindowManager`.
3. El usuario define nombre, descripción y roles.
4. Al pulsar "INIT_RLM_SWARM_LAUNCH":
   - Se activa la `BootSequence` con ondas y matrix data streams.
   - El `RLMCompiler` descompone la descripción en pilares.
   - El `RLMDispatcher` crea ramas y nodos en el grafo.
   - El SAT Solver valida la consistencia post-generación.
5. El escritorio se puebla de nodos interconectados, listos para explorar.

## Roles RBAC
| Rol | Permisos |
|-----|----------|
| Soberano (admin) | Control total: PINs, eliminación, gobernanza. |
| Arquitecto (editor) | Creación, edición, autocompletado. No puede modificar PINs. |
| Observador (viewer) | Solo lectura. Acceso a Forensic HUD para auditoría. |

## Tecnologías
- **RLM Core**: Descomposición recursiva de intenciones.
- **Rust SAT Solver**: Validación de consistencia post-generación.
- **CSS Keyframes**: Animaciones de "Neural Ripple" y scanline.

## Verificación
- [x] Manifest se abre automáticamente en proyectos nuevos.
- [x] Roles se persisten y aplican en guards.
- [x] BootSequence muestra actividad visual durante scaffolding.
- [x] Grafo se puebla con ramas y nodos lógicos.
