# PREFLIGHT CHECKLIST: HITO-2.0 WorkGraph UI Scaffold

> **STATUS**: APPROVED
> **HITO**: 2.0
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: Checked `PROJECT_CHARTER.md`.
- [x] **The Law**: "Dual-mode UX: individual first".
- [x] **The Stack**: Next.js 15 (App Router), React Flow, TipTap, Tailwind, Lucide, Zustand.

## 2. Objective & Scope
**Goal**: Establecer los cimientos de la Web App. El usuario debe poder ver el "Grafo Vacío" y tener un editor de texto funcional.

**Scope**:
- [x] **Setup**: Inicializar proyecto Next.js 15 con TypeScript estricto.
- [x] **Graph View**: Implementar componente base `GraphCanvas` (React Flow) en ruta `/`.
- [x] **Editor**: Implementar componente base `NodeEditor` (TipTap) en ruta `/editor`.
- [x] **Layout**: Sidebar de navegación persistente + Canvas.
- [x] **State**: Configurar `useGraphStore` con Zustand.

## 3. Implementation Plan
### 3.1 Structure
```text
src/app/
  ├── layout.tsx       # Main layout (Sidebar + Canvas Container)
  ├── page.tsx         # Home (Graph View)
  └── editor/          # Editor Route
      └── page.tsx
src/components/
  ├── graph/           # React Flow components
  │   └── GraphCanvas.tsx  (Renamed from WorkGraphCanvas)
  ├── editor/          # TipTap components
  │   └── NodeEditor.tsx   (Renamed from ClaimEditor)
  └── ui/              
src/store/
  └── useGraphStore.ts # Zustand store for WorkGraph
```

### 3.2 Technical Constraints
- [x] **Client Components**: Usar 'use client' donde sea necesario.
- [x] **Graph-First UX**: Vista principal es el grafo.

## 4. Verification Plan (The Gate)
### 4.1 Manual Verification
- [x] **Launch**: `npm run dev` starts without errors.
- [x] **Visual**: `/` shows Graph, layout shows Sidebar.
- [x] **Editor**: `/editor` shows TipTap editor.

## 5. Definition of Done
- [x] **Gate**: Web App Scaffold operational.
- [x] **Evidence**: Build success and file structure verification.
