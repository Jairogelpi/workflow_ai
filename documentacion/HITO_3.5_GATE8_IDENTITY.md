# Hito 3.5: Gate 8 - Identidad & Personal Cloud (Isolation)

## 🎯 Objetivo de Seguridad 2026
Transformar el WorkGraph OS de un prototipo monousuario a un **SaaS Multi-Tenant** seguro, donde la identidad del usuario es el eje central de la ingestión y la búsqueda.

## 🛠️ Implementación Técnica

### 1. Autenticación Transparente (Extension ↔ Web)
Se ha implementado una arquitectura de herencia de sesión:
- **`credentials: 'include'`**: La extensión utiliza las cookies seguras de la aplicación web (`localhost:3000`) para comunicarse con la API sin necesidad de un segundo login.
- **SSR Client**: El servidor utiliza `@supabase/ssr` para validar la sesión en cada Request de forma nativa en Next.js 15.

### 2. Aislamiento de Datos (RLS)
Se han habilitado políticas de **Row Level Security** en todas las tablas críticas:
- `projects`: Filtro estricto `auth.uid() = owner_id`.
- `work_nodes` / `work_edges`: Aislamiento transitivo basado en la propiedad del proyecto.

### 3. Smart Project Selector
La extensión ha evolucionado de un "Inbox ciego" a un sistema multi-proyecto:
- **Proyectos Dinámicos**: La Side Panel consulta la API `/api/user/projects` al cargar.
- **Contexto Explícito**: El usuario elige el proyecto destino antes de materializar el conocimiento.

### 4. Búsqueda Vectorial Segura (Neural Isolation)
El "Broche de Oro" de seguridad:
- Se ha creado la función RPC `match_node_embeddings` que obliga a filtrar por `project_id`.
- Se implementó `src/lib/ingest/retriever.ts` como la capa de servicios que garantiza que la IA solo consuma documentos del proyecto autorizado.

## 🚀 Impacto en el Producto
- **Privacidad Total**: Los datos están aislados a nivel de DB.
- **UX Fluida**: El login de la web app se activa automáticamente en la extensión.
- **Escalabilidad**: Soporte nativo para múltiples contextos (Trabajo, Personal, Investigación).

---
*Estado: Completado y Verificado (Gate 8 Done)*
