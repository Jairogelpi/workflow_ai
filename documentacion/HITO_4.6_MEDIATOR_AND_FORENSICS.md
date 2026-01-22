# Hito 4.6: Mediator Agent v3.0 & Forensic Transparency

## 1. Visión General
Este hito completa el "Cerebro Operativo" de WorkGraph, integrando el modelo RLM (Reasoning, Language, Memory) con una interfaz de transparencia radical. El sistema ha pasado de ser un procesador de texto a un **Agente Mediador** capaz de razonar sobre la estructura del grafo y exponer su "sistema nervioso" al usuario.

## 2. Mediator Agent (El Cerebro Operativo)
El `MediatorAgent.ts` actúa como el orquestador entre los kernels de conocimiento.

### Funciones Críticas:
- **Pulse Loop**: Ciclo de inferencia constante que detecta vacíos estructurales (afirmaciones sin evidencia) y tensiones lógicas (contradicciones con el Canon).
- **Recursive Abstraction**: Identificación automática de clústeres de información. Cuando se detectan 5 o más evidencias relacionadas, el sistema propone un **Hierarchical Digest** para reducir la carga cognitiva.
- **Ghost Nodes (Nodos Fantasma)**: Las propuestas de la IA se renderizan directamente en el grafo como borradores (Drafts) con bordes punteados, permitiendo una "Negociación de Ideas" visual.

## 3. Percepción X-Ray (Visualización Ambiental)
Integración de la extensión con el núcleo del sistema para una captura de información sin fricción.

- **Ambient Glow**: Los bloques de texto en la web se iluminan automáticamente por categoría (Claim, Evidence, Assumption).
- **Shift+Click Confirm**: El humano deja de "capturar" para pasar a "validar". Un solo gesto confirma la pre-identificación de la IA.
- **Sentiment Density**: El HUD de la extensión muestra en tiempo real la "Densidad de Evidencia" de la página actual.

## 4. Transparencia Forense (Forensic HUD)
En el `SmartViewer`, el usuario puede ver los "nervios" del sistema pulsando **ALT**.

- **Forensic HUD**: Muestra latencia de compilación, presupuesto consumido (BYOK) y conteo de trazas.
- **Assertion Map Visualization**: Cables de datos visuales que conectan párrafos específicos con sus nodos fuente en el Canon.
- **Interactive Audit Trail**: Hover sobre el texto para revelar la evidencia original, su puntuación de confianza y su hash de integridad SHA-256.

## 5. Arquitectura de Datos
- **Receipts**: Cada artefacto incluye un `CompilationReceipt` que actúa como el registro forense de su generación.
- **Audit Store**: Centralización de métricas de rendimiento y coste para auditoría inmediata.

---
*WorkGraph OS: Un sistema que no solo piensa, sino que muestra cómo piensa.*
