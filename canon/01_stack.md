bajo tienes un “mapa de stack 2026” orientado específicamente a **WorkGraph OS** (web app + grafo + versionado + compiler RLM + extensión MV3 + BYOK + receipts + escalado).

Lo estructuro en: **lenguajes**, **front**, **extensión**, **back**, **datos**, **jobs**, **infra**, **observabilidad/seguridad** y, al final, **3 stacks recomendados** (elige según tu go-to-market).

1. ## **Lenguajes recomendados (2026, para este producto)**
- **TypeScript**: lenguaje unificador para Front, extensión y gran parte del backend (reduce fricción y bugs).
- **SQL (Postgres)**: para IR, audit trail, receipts, permisos.
- **Python** (opcional pero muy útil): para el **RLM Compiler** (pipeline planner/retriever/verifier) si quieres velocidad de iteración en LLM tooling.
- **Go o Rust** (opcional): para workers de alto rendimiento cuando el compile/parse crezca mucho (no necesario al principio).

1. ## **Frontend (Web App)**
   **Mejor “default” para app compleja 2026:**

- **React 19** (para UI compleja y UX moderna).
- **Next.js 15** (App Router) si quieres fullstack React con SSR/edge y gran ecosistema.
- **Vite** como toolchain cuando no uses Next (o para librerías internas).

**UI/estado/datos (lo que mejor encaja con grafo + editor):**

- Editor: TipTap/ProseMirror
- Estado: Zustand o Jotai; server-state: TanStack Query
- Grafo: React Flow o Cytoscape.js
- Validación: Zod
- Estilos: Tailwind

**Nota práctica:** Astro es excelente para marketing/docs, pero para el **core app “graph + editor + realtime-ish”** React/Next suele ganar por ergonomía.

1. ## **Extensión de navegador (captura “acción explícita”)**
- **Chrome Extension Manifest V3** (service worker + content scripts).
- Framework: TypeScript + Vite (build) + MV3 tooling (plasmoh opcional).
- Patrón clave: “selección/click → side panel → POST a tu API / local store”. (MV3 condiciona arquitectura por el lifecycle del service worker).

1. ## **Backend (API + permisos + receipts)**
   **Dos rutas “top” en 2026:**
   1. ### **Ruta A: TypeScript end-to-end (rápida para producto)**
- **Node.js + NestJS** (arquitectura limpia) o **Fastify** (alto rendimiento).
- REST o GraphQL según necesidades (REST suele bastar).
- Zod + OpenAPI.
  1. ### **Ruta B: Python para el compiler (si priorizas RLM)**
- **FastAPI** para API
- Workers Python para planner/retriever/verifier/assembler

En ambos casos: el compiler debe ser **idempotente**, con compilation\_id, receipts, y reintentos.

1. ## **Datos y almacenamiento (núcleo del sistema)**
   1. ### **Base de datos (IR + audit + receipts)**
- **Postgres** (indiscutible para este caso).
- Plataforma recomendada si quieres velocidad: **Supabase** (Postgres + Auth + Storage + Edge Functions + Vector).
  - Sus **Edge Functions** son TypeScript y se ejecutan en Deno (ideal para webhooks y glue code).
    1. ### **Escalado “serverless Postgres” (alternativa)**
- **Neon** si quieres autoscaling/scale-to-zero y workflows modernos con entornos efímeros.
  1. ### **Archivos**
- **S3-compatible** (AWS S3, Cloudflare R2, Backblaze B2). Para evidencias/adjuntos y hashes.
  1. ### **Búsqueda**
- Para producción: **Postgres FTS** + (si crece) **OpenSearch/Elasticsearch**.
- Vector (si lo necesitas): **pgvector** (Supabase lo empaqueta como “Vector embeddings”).

1. ## **Jobs / Orquestación (lo que te hace “producción” de verdad)**
   Tú vas a tener tareas largas: ingest, digest, compile recursivo, verificación, export…

   **Opción premium (muy recomendada para fiabilidad):**

- **Temporal** para “durable execution” (reintentos, larga duración, recuperación tras fallos).

**Opción pragmática (MVP → scale medio):**

- **Redis queue** (BullMQ) / Upstash
- Cron/schedulers sencillos

**Edge queues (muy competitivas en 2026 si eliges Cloudflare):**

- **Cloudflare Queues** (at-least-once, buffering, offload de requests).

1. ## **Observabilidad (sin esto, no hay escala)**
- **OpenTelemetry (OTel)** como estándar vendor-neutral para traces/metrics/logs.
- Sentry (errores) + Grafana/Datadog (métricas) según presupuesto y complejidad.

1. ## **Seguridad y BYOK (core de tu propuesta)**
- BYOK implica: **vault de secretos**, revocación, scopes, rate limits por usuario/org, y logging mínimo.
- Si guardas claves server-side: usa **KMS** (AWS/GCP) o equivalente; si puedes, **preferencia por client-side** y tokens efímeros.
- Regla operativa: receipts y audit trail deben registrar “qué se usó” sin exfiltrar secretos.

# 01 — STACK (Enforced Constraints)

This document defines the **Active Perimeters** of WorkGraph OS. Any deviation is a violation of the system's design.

## 1. Core Stack (Non-Negotiable)
- **Language**: TypeScript (Strict Mode)
- **Frontend**: React 19 + Next.js 15 (App Router)
- **Logic/Compiler**: Python 3.12 (FastAPI) for RLM Pipeline
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase/Neon) + pgvector
- **Editor**: TipTap (ProseMirror based)
- **State**: Zustand (Client) + TanStack Query (Server)
- **Verification**: Zod (Schema validation)
- **API Strategy**: OpenAPI / Contract-First design.
- **Versioning**: Semantic Versioning (SemVer) for all modules and APIs.

## 2. Infrastructure & Operations
- **BYOK**: Mandatory. No hardcoded or invisible AI costs.
- **Jobs/Scaling**: Temporal (Durable Execution) or BullMQ.
- **Observability**: OpenTelemetry + Sentry.
- **Storage**: S3 Compatible (Cloudflare R2).

## 3. Anti-Deviation Rules (❌ Prohibited)
- **No JS**: Pure JavaScript is prohibited. Use TypeScript for everything.
- **No Mock Data**: No hardcoded deliverables. Everything must come from the WorkGraph.
- **No In-Component Business Logic**: Business logic must be in the IR/Logic layer.
- **No Unscoped Models**: Model calls must be wrapped and budgeted.
- **No Destructive Edits**: Edits must generate a new version hash.

## 4. Mandatory Enforcement
- **Linting**: ESLint + Prettier (Strict).
- **Type Checking**: `tsc --noEmit` on every commit.
- **Zod Validation**: Mandatory at all boundaries (API, IR, Storage).
- **Audit Logging**: Every RLM compilation must generate an immutable receipt.

## 5. Golden Rule
If the system allows an action that contradicts these constraints, the system is designed incorrectly and must be refactored.
