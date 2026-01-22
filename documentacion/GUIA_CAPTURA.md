# Guía Rápida: Sistema de Captura Universal

## 🎯 ¿Qué puedes capturar?

### 1. Archivos desde LLMs
Cuando subes un archivo a ChatGPT, Claude o Gemini, aparece un botón **📥 Send to WorkGraph**.

**Uso**:
1. Sube archivo al LLM
2. Click botón o arrastra a zona flotante
3. Done! El archivo se procesa automáticamente

### 2. Texto desde Cualquier Web
Selecciona texto en Wikipedia, artículos, emails, etc.

**Uso**:
1. Selecciona texto
2. Arrastra a ventana flotante de WorkGraph
3. Suelta → Se crea un nodo automáticamente

**Metadata Capturada**:
- Texto completo
- URL de origen
- Título de página
- Timestamp

### 3. Archivos Locales
Arrastra archivos desde tu escritorio/explorador.

**Uso**:
1. Arrastra archivo desde tu PC
2. Suelta en ventana flotante
3. Procesamiento completo (chunking + vectorización)

**Formatos Soportados**:
- PDFs
- Word/Excel
- Imágenes
- Texto plano

---

## 🎨 Feedback Visual

**Cuando arrastras TEXTO**:
- 📄 Icono de documento
- "Drop text to create node"
- Ring azul alrededor de ventana

**Cuando arrastras ARCHIVOS**:
- ⬆️ Icono de upload
- "Drop files here"
- Ring azul alrededor de ventana

---

## ⌨️ Atajos

| Acción | Método 1 | Método 2 |
|--------|----------|----------|
| Capturar archivo LLM | Click botón 📥 | Arrastra a drop zone |
| Capturar texto | Arrastra selección | - |
| Capturar local | Arrastra archivo | - |

---

## 🔧 Troubleshooting

**"No aparece el botón de captura"**:
- Verifica que la extensión esté activa
- Recarga la página del LLM
- Asegúrate de estar en ChatGPT/Claude/Gemini

**"No puedo arrastrar texto"**:
- Asegúrate de tener una ventana flotante abierta
- Verifica permisos del navegador

**"El archivo no se procesa"**:
- Verifica tamaño (<50MB recomendado)
- Formato debe ser soportado
- Revisa consola para errores

---

## 📋 Tipos de Nodos Creados

| Origen | Tipo de Nodo | Contenido |
|--------|--------------|-----------|
| Texto arrastrado | `note` o `idea` | Texto + URL origen |
| Archivo PDF | `artifact` + `excerpt`s | Chunks vectorizados |
| Imagen | `artifact` | Metadata + almacenamiento |

---

**Tip**: Usa ventanas flotantes como "bandejas de entrada" para organizar capturas antes de conectarlas al grafo principal.
