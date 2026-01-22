# Hito 2.8: The Window Manager & WorkGraph OS UX

> **Status:** Implemented  
> **Date:** January 2026

## Overview
Moving beyond a simple web pages, WorkGraph OS now implements a true "Operating System" metaphor within the browser. This allows for high-density multitasking where users can consult documents, inspect code, and verify evidence *without* leaving the context of the knowledge graph.

## Core Components

### 1. The Floating Panel (`FloatingPanel.tsx`)
A reusable, draggable, and resilient window container.
- **Glassmorphism:** Uses `backdrop-blur-xl` and semi-transparent slate backgrounds to maintain context of what's behind the window.
- **Window Controls:** Standard OS-like controls for Minimize (Maximize toggle) and Close.
- **Draggable Header:** Users can reposition windows to customize their workspace layout.

### 2. Global State Integration (`useGraphStore.ts`)
The window manager state is held globally in the Zustand store, allowing any component in the application (Sidebar, Nodes, Search) to request opening a remote resource.
- `activePreview`: Stores the `url`, `title`, and `type` of the currently focused content.

### 3. The Inspect Action (`SourceNodeView.tsx`)
We have replaced the legacy "Download" default behavior with an "Inspect in OS" action. 
- **Button:** `Eye` icon trigger.
- **Behavior:** Fetches a signed URL from Supabase Storage and hydrates the Global Window State.

## Visual Language (Glassmorphism 2.0)
The UI adopts a "Minority Report" aesthetic:
- **Colors:** Deep Slate (`slate-900`) mixed with Indigo/Blue accents.
- **Translucency:** Heavy use of alpha channels to denote depth.
- **Shadows:** `shadow-2xl` for the active window to lift it visually above the graph canvas.

## Future Roadmap (UX 3.0)
- **Multi-Window Support:** Currently supports 1 active window. Future updates will allow an array of windows stacking (z-index management).
- **Resizing:** Corner drag handles for resizing windows.
- **Minimizing to Dock:** Minimizing windows to a bottom "Taskbar".
