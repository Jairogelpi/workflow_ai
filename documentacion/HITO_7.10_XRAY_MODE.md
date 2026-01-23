# Hito 7.10: Forensic Audit Mode (X-Ray Vision)

## Descripción
El Modo X-Ray transforma el escritorio en un "Espejo Cognitivo", permitiendo inspección total del razonamiento de la IA, costos de sesión, y confianza de cada nodo.

## Componentes Implementados

### Hooks
- **`useXRayMode.ts`**: Estado global Zustand para toggle de transparencia y hover tracking.

### UI
- **`ForensicAuditView.tsx`**: Panel flotante con métricas de sesión (Spend, Burn Rate, Integrity).
- **`XRayOverlay.tsx`**: Burbuja de razonamiento para cada nodo (aparece en hover).

### Integración
- **`GraphCanvas.tsx`**: Botón Eye toggle para activar X-Ray Mode.

## Métricas Expuestas
| Métrica | Descripción |
|---------|-------------|
| Session Spend | Gasto acumulado en USD desde el inicio de sesión. |
| Burn Rate | Gasto por hora proyectado. |
| Integrity Score | Porcentaje de nodos verificados por SAT. |
| Latency | Tiempo de respuesta del Kernel por operación. |
| Confidence | Confianza del modelo en cada nodo autogenerado. |

## X-Ray Overlay (Burbujas de Razonamiento)
Al hacer hover sobre un nodo en modo X-Ray:
- Se muestra el "por qué" de la creación del nodo.
- Se muestra la confianza del modelo (%).
- Se muestra el costo en USD de la inferencia.
- Se muestra la firma de autoridad (Ed25519 + SAT Verified).

## Circuit Breaker
Botón de emergencia para detener toda comunicación con LLMs si se detecta:
- Gasto excesivo (Burn Rate > umbral).
- Bucle de alucinación (contradicciones repetidas).
- Deriva ética (contenido fuera de policy).

## Tecnologías
- **Zustand**: Estado reactivo para toggle global.
- **observability.ts**: Fuente de métricas de sesión.
- **CSS Glassmorphism**: Estética premium para el panel forense.

## Verificación
- [x] Toggle de X-Ray Mode funcional desde la barra de herramientas.
- [x] ForensicAuditView muestra métricas en tiempo real.
- [x] XRayOverlay aparece en hover con datos del nodo.
- [x] Circuit Breaker visible y preparado para conexión con Gateway.
