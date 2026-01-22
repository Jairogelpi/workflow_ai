# X-Ray Vision System - Technical Documentation

## Overview

El **X-Ray Vision System** es una capa de realidad cognitiva que se superpone a cualquier página web, analizando y clasificando el contenido semántico en tiempo real.

## Core Concepts

### Fricción Cero
El sistema opera completamente en segundo plano. No requiere acción del usuario para iniciar el análisis—simplemente sucede mientras navegan.

### Percepción X-Ray
Al presionar `Alt` o activar el toggle, el usuario "ve" la estructura semántica oculta del contenido: qué son afirmaciones, qué es evidencia, qué son suposiciones.

### Captura de Un Click
No más copiar-pegar. Hover → Confirm → Done.

---

## Architecture Diagram

```
┌─────────────────────────────┐
│     Web Page (Any Site)     │
└──────────────┬──────────────┘
               │
               ▼
┌──────────────────────────────┐
│   TextBlockDetector          │
│   - MutationObserver         │
│   - Quality filtering        │
│   - CSS selector generation  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   SemanticBuffer             │
│   - Batch queue (5/2s)       │
│   - Prevents LLM overload    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Background Script          │
│   - CLASSIFY_TEXT handler    │
│   - Heuristic classification │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   XRayHighlighter            │
│   - Shadow DOM overlays      │
│   - Color-coded by type      │
│   - Capture button on hover  │
└──────────────────────────────┘
```

---

## Component Details

### 1. TextBlockDetector

**Purpose**: Scan DOM for meaningful text blocks

**Key Features**:
- Targets: `p`, `article`, `section`, `blockquote`, etc.
- Filters: 50-1000 character range
- Quality check: Excludes mostly-links or code
- Generates unique CSS selectors

**Performance**:
- Uses `WeakSet` to track processed elements
- Debounces DOM changes (500ms)
- Lazy: Only processes new content

### 2. SemanticBuffer

**Purpose**: Batch text blocks for efficient classification

**Algorithm**:
```
IF queue.length >= 5 OR timer >= 2s
  THEN process batch
  ELSE wait
```

**Benefits**:
- Reduces API calls
- Prevents UI blocking
- Predictable cost

### 3. Semantic Classification

**Current**: Heuristic-based
```typescript
Claim:      /\b(is|are|will|must)\b/ && no '?'
Evidence:   /\b(study|research|data|found)\b/
Assumption: /\b(assume|suppose|if)\b/
```

**Future**: OpenAI API
```typescript
POST /v1/chat/completions
{
  model: "gpt-4o-mini",
  messages: [{
    role: "system",
    content: "Classify as claim/evidence/assumption"
  }]
}
```

### 4. XRayHighlighter

**Shadow DOM Strategy**:
```typescript
const shadowHost = createElement('div');
shadowHost.style.zIndex = '999999';
shadowHost.style.pointerEvents = 'none';

const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
```

**Why Shadow DOM?**:
- Complete style isolation
- No conflicts with page CSS
- Clean teardown

**Overlay Rendering**:
```typescript
overlay.style = {
  position: 'absolute',
  top: rect.top + scrollY,
  left: rect.left + scrollX,
  width: rect.width,
  height: rect.height,
  background: `rgba(color, 0.15)`,
  border: `2px solid rgba(color, 0.6)`
}
```

### 5. XRayState

**Observable Pattern**:
```typescript
class XRayState {
  private listeners = new Set();
  
  setActive(active: boolean) {
    this.notifyListeners();
  }
  
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
```

**Alt Key Integration**:
```typescript
keydown(e) {
  if (e.key === 'Alt') xrayState.setActive(true);
}
keyup(e) {
  if (e.key === 'Alt') xrayState.setActive(false);
}
```

---

## Data Flow

### Scanning Phase

```
Page Load
  ↓
TextBlockDetector.start()
  ↓
MutationObserver watches DOM
  ↓
New <p> detected
  ↓
processElement()
  ↓
Filter (50-1000 chars, quality)
  ↓
SemanticBuffer.add(block)
```

### Classification Phase

```
Buffer reaches 5 blocks OR 2s timeout
  ↓
processBatch()
  ↓
chrome.runtime.sendMessage('CLASSIFY_TEXT')
  ↓
Background: classifyText(text)
  ↓
Heuristic analysis
  ↓
Return {type, confidence}
  ↓
block.classification = result
```

### Visualization Phase

```
User presses Alt
  ↓
xrayState.setActive(true)
  ↓
XRayHighlighter.setActive(true)
  ↓
renderHighlights()
  ↓
For each classified block:
  highlighter.highlight(block)
  ↓
Shadow DOM overlay created
  ↓
Positioned over element
```

### Capture Phase

```
User hovers overlay
  ↓
Capture button appears
  ↓
User clicks "📥 Confirm"
  ↓
handleCapture(block)
  ↓
POST /api/nodes/quick
{
  content: block.text,
  source_url: window.location.href,
  type: block.classification.type,
  metadata: { selector, confidence }
}
  ↓
Node created in WorkGraph
  ↓
Success notification
```

---

## API Reference

### TextBlockDetector

```typescript
class TextBlockDetector {
  constructor(onBlockDetected: (block: TextBlock) => void)
  
  start(): void
  stop(): void
  
  private scanPage(): void
  private processElement(el: HTMLElement): void
  private getSelector(el: HTMLElement): string
}
```

### SemanticBuffer

```typescript
class SemanticBuffer {
  constructor(onClassify: (blocks: TextBlock[]) => Promise<void>)
  
  add(block: TextBlock): void
  getQueueSize(): number
  clear(): void
}
```

### XRayHighlighter

```typescript
class XRayHighlighter {
  init(): void
  setActive(active: boolean): void
  highlight(block: TextBlock, onCapture: (block) => void): void
  removeOverlay(element: HTMLElement): void
  updateAllPositions(): void
  clear(): void
  destroy(): void
}
```

### XRaySystem

```typescript
class XRaySystem {
  start(): void
  stop(): void
  
  private handleBlockDetected(block: TextBlock): void
  private handleClassification(blocks: TextBlock[]): Promise<void>
  private handleCapture(block: TextBlock): Promise<void>
}
```

---

## Performance Considerations

### Memory

- **WeakSet** for processed elements (auto garbage collection)
- **Map** for overlays (manual cleanup on destroy)
- **Event listeners**: Cleaned up on stop()

### CPU

- **Debouncing**: Scroll (100ms), DOM changes (500ms)
- **Lazy rendering**: Only visible viewport
- **Batching**: Max 5 blocks per classification call

### Network

- **Batch API calls**: 5 blocks at a time
- **Debounce**: 2s between batches
- **Retry**: None (fail-fast, log error)

---

## Security

### Content Security Policy

The extension requires:
```json
{
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["<all_urls>"]
}
```

### Shadow DOM Isolation

- Prevents XSS from page CSS
- Styles cannot leak out
- Page cannot access our DOM

### API Communication

```typescript
// Extension → Background (internal)
chrome.runtime.sendMessage({ type: 'CLASSIFY_TEXT', text })

// Extension → Backend (external)
fetch('http://localhost:3000/api/nodes/quick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

---

## Future Enhancements

### Phase 2: Real LLM Integration

Replace heuristics with:
```typescript
const classification = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: 'Classify text as claim, evidence, or assumption. Return JSON: {type, confidence}'
  }, {
    role: 'user',
    content: text
  }],
  response_format: { type: 'json_object' }
});
```

### Phase 3: Relation Detection

```typescript
// Detect relationships between blocks
const relations = await detectRelations(blocks);
// {source: block1, target: block2, type: 'evidence_for'}
```

### Phase 4: Auto-Linking

```typescript
// Link to existing nodes in graph
const similarNodes = await findSimilar(block.text);
if (similarNodes.length > 0) {
  suggestLink(newNode, similarNodes[0]);
}
```

---

## Troubleshooting

### Issue: Highlights don't appear

**Check**:
1. Is Alt key pressed?
2. Are there text blocks >50 chars?
3. Console errors?

**Debug**:
```javascript
// In console
xrayState.isActive  // Should be true
xraySystem.classifiedBlocks.length  // Should be > 0
```

### Issue: Wrong classification

**Current**: Heuristics are simple  
**Solution**: Upgrade to real LLM (Phase 2)

### Issue: Performance lag

**Check**:
1. How many blocks detected?
2. Scroll performance?

**Fix**:
- Increase debounce timers
- Reduce batch size
- Disable on heavy pages

---

**Version**: 1.0.0  
**Status**: Core Complete  
**Next**: HUD + LLM Integration
