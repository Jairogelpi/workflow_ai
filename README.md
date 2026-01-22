# WorkGraph OS

> **Sistema de Razonamiento y Captura Universal**  
> Transforma cualquier fuente de conocimiento en un grafo navegable y consultable.

[![Phase](https://img.shields.io/badge/Phase-2%20Complete-green)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()

---

## 🌟 Características Principales

### 🎯 Captura Universal
- **Desde LLMs**: Captura archivos de ChatGPT, Claude, Gemini con un click
- **Drag & Drop**: Arrastra texto desde cualquier web → Nodo creado automáticamente
- **Archivos Locales**: Arrastra PDFs, documentos, imágenes desde tu PC

### 🧠 Razonamiento Avanzado
- **Compilación Recursiva**: Subdivide tareas complejas automáticamente
- **Retrieval Selectivo**: Usa digests para contexto, raw para precisión
- **Grafo Visual**: Navega dependencias y relaciones

### 🔐 Seguridad BYOK
- **Tus Claves**: Cifrado cliente-side (AES-256-GCM)
- **Zero Trust**: Las claves nunca salen del navegador
- **Rate Limiting**: Control de costos por usuario

### 🛡️ Canon Enforcement
- **PIN Nodes**: Protección de verdades fundamentales
- **Guards**: Evita contradicciones y borrados accidentales
- **Staleness Detection**: Identifica conocimiento obsoleto

---

## 🚀 Quick Start

### Instalación

```bash
# Clone
git clone https://github.com/yourorg/workgraph-os.git
cd workgraph-os

# Install
npm install

# Setup Supabase
cp .env.example .env.local
# Añade tus credenciales de Supabase

# Run
npm run dev
```

### Instalar Extensión

```bash
cd extension
npm install
npm run build

# Chrome: chrome://extensions
# Load unpacked → extension/dist
```

---

## 📖 Documentación

- [**Sistema de Captura Universal**](./documentacion/SISTEMA_CAPTURA_UNIVERSAL.md) - Guía técnica completa
- [**Guía de Captura**](./documentacion/GUIA_CAPTURA.md) - Quick reference para usuarios
- [**ROADMAP**](./ROADMAP.yml) - Hitos y evidencia

---

## 🎬 Demo

### Captura desde ChatGPT
1. Sube PDF a ChatGPT
2. Click "📥 Send to WorkGraph"
3. Nodo creado con chunks vectorizados

### Drag & Drop Texto
1. Selecciona texto en Wikipedia
2. Arrastra a ventana flotante
3. Nodo con texto + URL origen

---

## 🏗️ Arquitectura

```
┌─────────────┐
│  Browser    │
│  Extension  │ ─────┐
└─────────────┘      │
                     ▼
┌─────────────────────────┐
│   Next.js Frontend      │
│   (React + ReactFlow)   │
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   API Routes (Backend)  │
│   - /ingest/file        │
│   - /ingest/link        │
│   - /nodes/quick        │
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Supabase              │
│   (PostgreSQL+pgvector) │
└─────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 19, ReactFlow, TipTap
- **Backend**: Next.js API Routes, Supabase
- **Extension**: Chrome MV3, Vite, TypeScript
- **Security**: Web Crypto API, Supabase RLS
- **Vector DB**: pgvector (OpenAI embeddings)

---

## 📋 Roadmap

- [x] Phase 0: IR Kernel
- [x] Phase 1: RLM Compiler
- [x] Phase 2: Capture & Interface
- [x] Phase 3: Scaling & Verification
- [x] Phase 4: Enterprise Hardening
- [x] Phase 5: Universal Capture System
- [ ] Phase 6: Multi-Agent Collaboration

Ver [ROADMAP.yml](./ROADMAP.yml) para detalles.

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el repo
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

---

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE)

---

## 💬 Soporte

- **Issues**: [GitHub Issues](https://github.com/yourorg/workgraph-os/issues)
- **Docs**: [/documentacion](./documentacion)
- **Email**: support@workgraph.io

---

**Built with ❤️ by the WorkGraph Team**
