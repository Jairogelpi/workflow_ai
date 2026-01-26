# WorkGraph OS: The Thinking Operating System 🖥️🧠

**WorkGraph OS** is a futuristic, high-performance environment designed to transform unstructured knowledge into **Executable Structure** with verifiable integrity. It is not just an app; it is a "Second Brain" operating system.

---

## 🏗️ Arquitectura del Sistema
> **Status**: v2.1.0 (100% Zero-Mock Production). See [ROADMAP.md](docs/ROADMAP.md) for future plans.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKGRAPH OS ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Extension  │    │   Next.js    │    │   Supabase   │      │
│  │  (X-Ray HUD) │◄──►│  (OS Shell)  │◄──►│  (SQL+pgvec) │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              OS KERNEL & SENSORIALITY LAYER              │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │ Window  │  │ Boot     │  │ Command  │  │ Neural   │  │   │
│  │  │ Manager │  │ Sequence │  │ HUD      │  │ Ripple   │  │   │
│  │  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               RUST CORE MODULES (WASM/Native)            │   │
│  │  ┌───────────┐ ┌───────────┐ ┌────────┐ ┌────────────┐  │   │
│  │  │ Antigrav  │ │ Signer    │ │ Logic  │ │ CRDT Sync  │  │   │
│  │  │ Engine    │ │ Core      │ │ SAT    │ │ Engine     │  │   │
│  │  │ (physics) │ │ (Ed25519) │ │ Solver │ │ (Yrs)      │  │   │
│  │  └───────────┘ └───────────┘ └────────┘ └────────────┘  │   │
│  │          ┌────────────────┐  ┌────────────────┐          │   │
│  │          │ Ingestor Rust  │  │ Stream Assemb. │          │   │
│  │          │ (PDF/HTML)     │  │ (Doc Export)   │          │   │
│  │          └────────────────┘  └────────────────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🦀 Módulos Rust

| Módulo | Propósito | Tecnología |
|--------|-----------|------------|
| **antigravity-engine** | Física del grafo 60 FPS | wasm-bindgen, glam |
| **signer-core** | Firmas Ed25519 | ed25519-dalek |
| **logic-engine** | SAT Solver para PINs | varisat |
| **crdt-sync** | Colaboración sin conflictos | yrs (Yjs Rust) |
| **ingestor-rust** | Parsing PDF/HTML | lopdf, scraper |
| **stream-assembler** | Exportación streaming | axum, tokio |

## 📚 Documentación de Arquitectura (Nivel Pro)
- [📉 Token Economy & Pricing](docs/TOKEN_ECONOMY.md) - Gestión de costes reales con OpenRouter.
- [🧩 Digest Engine (Hierarchical Memory)](docs/DIGEST_ENGINE.md) - Arquitectura Fractal Map-Reduce.
- [🐝 Swarm Intelligence Agents](docs/AGENTS.md) - Orquestación de agentes con "Absolute Reality".
- [🧠 Arquitectura Graph-RAG](documentacion/GRAPH_RAG_ARCHITECTURE.md) - Memoria vectorial y Grafos.

---

## 🚀 Quick Start (Critical: Read This)

### Paso 0: Activar el Cerebro Físico (Vectores)
Para que el sistema funcione (Memoria Real), **debes** ejecutar la migración de vectores:
1. Copia el contenido de `supabase_schema_vectors.sql` (en la raíz o escritorio).
2. Ejecútalo en el **SQL Editor** de tu Dashboard de Supabase.

### Paso 1: Instalación
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar en desarrollo
npm run dev

# 4. (Opcional) Docker Compose para todo el stack
docker compose up
```

---

## 📁 Estructura del Proyecto

```
workgraph/
├── src/
│   ├── app/              # Next.js App Router
│   ├── canon/schema/     # IR Zod Schemas
│   ├── compiler/         # RLM Pipeline
│   ├── kernel/           # Core Logic
│   ├── components/       # React UI
│   └── store/            # Zustand State
├── extension/            # Chrome MV3 Extension
├── antigravity-engine/   # Rust/WASM Physics
├── signer-core/          # Rust Ed25519 Signing
├── logic-engine/         # Rust SAT Solver
├── crdt-sync/            # Rust CRDT Engine
├── ingestor-rust/        # Rust Heavy Parsing
├── stream-assembler/     # Rust Doc Export
└── documentacion/        # Technical Docs
```

---

## 🔐 Seguridad

- **BYOK (Bring Your Own Key)**: Las claves API se cifran con AES-GCM.
- **Ed25519 Signatures**: Cada nodo firmado tiene una prueba criptográfica inmutable.
- **JIT Decryption**: Las claves solo se descifran en memoria durante la llamada.
- **Log Sanitization**: Todas las claves se redactan automáticamente en logs.

---

## 📊 Observabilidad

- **OpenTelemetry**: Todas las operaciones emiten trazas.
- **Audit Store**: Cada llamada LLM registra tokens, coste y latencia.
- **Forensic IDs**: Cada párrafo generado es trazable a su evidencia.

---

## 📜 Licencia

MIT © 2026 WorkGraph OS
