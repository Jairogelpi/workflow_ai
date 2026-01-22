# WorkGraph OS: Especificación Técnica de la Capa de Entorno (Shell) [2026]

Esta especificación detalla la implementación de la capa de interfaz de usuario de nivel de sistema operativo que transforma WorkGraph de una aplicación web a un entorno de gestión de conocimiento multidimensional.

---

## 🏗️ 1. El Shell del Escritorio (`Desktop.tsx`)

El "Desktop" actúa como el contenedor raíz del ecosistema, proporcionando servicios de sistema globales.

### Componentes Core:
- **System Top Bar**: Gestiona el estado global (reloj, conectividad, métricas de hardware simuladas).
- **Floating Dock**: El centro de lanzamiento de aplicaciones internas (Graph, Terminal, Settings). Utiliza estados dinámicos de `active` y `highlight` para feedback visual.
- **Atmospheric Background**: Capa de iluminación ambiental mediante gradientes radiales animados con `animate-pulse`, diseñada para reducir la fatiga visual.

---

## 🪟 2. Infinity Window Manager (`WindowManager.tsx`)

A diferencia de las arquitecturas de "Panel Único", el gestor de ventanas de WorkGraph OS permite flujos de trabajo paralelos e inconexos.

### Lógica de Apilamiento (Z-Index Engine):
El sistema utiliza un registro reactivo en el `useGraphStore` para rastrear:
- `id`: Identificador único de la ventana (mapeado al NodeId).
- `zIndex`: Posición en la profundidad. Cada vez que una ventana recibe foco mediante `onMouseDown`, su `zIndex` se incrementa al `max(existing) + 1`.
- `isOpen`: Estado de visibilidad para optimización de renderizado (Mount/Unmount).

---

## 🌀 3. Sensorialidad y Física (`Sensoriality Layer`)

Para que el sistema se sienta "biológico" y no solo mecánico, se han implementado dos subsistemas de retroalimentación:

### A. Spatial Magnetism (Rust/WASM Physics)
Integrado en `useAntigravityEngine.ts`, el motor de física interrumpe el bucle de renderizado para aplicar fuerzas de atracción hacia el cursor.
- **Rango**: 300px de radio.
- **Algoritmo**: `x -= dx * ((300 - dist) / 5000)`. Crea un efecto de "pozo de gravedad" sutil.

### B. Neural Ripple (Feedback Visual)
Componente que escucha el flujo de pensamientos del RLM (`rlmThoughts`).
- **Trigger**: Se activa ante acciones críticas con el flag `[ACTION]`.
- **Implementación**: Genera ondas CSS transformadas radialmente que se propagan desde el centro del workspace, confirmando visualmente la actividad del enjambre.

---

## 🎬 4. Secuencia de Arranque (Boot Sequence)

Diseñada para establecer un contrato de confianza con el usuario:
- **Integrity Checks**: Simulación de validación de firmas Ed25519 y consistencia del Kernel.
- **Cinemática**: Animación de opacidad y progreso lineal con 0.6s de intervalo por paso de verificación.

---

## 🛠️ 5. Guía de Extensión para Desarrolladores

Para abrir una nueva ventana desde cualquier componente:
```typescript
const toggleWindow = useGraphStore(state => state.toggleWindow);

toggleWindow('mi-ventana-id', true, {
    title: 'Nueva Aplicación',
    contentType: 'editor', // 'pdf', 'web', 'text'
    contentUrl: '/api/v1/content',
    nodeData: {...}
});
```

---

*WorkGraph OS: The Future of Sovereignty.*
