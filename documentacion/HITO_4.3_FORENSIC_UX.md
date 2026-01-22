# Hito 4.3: Forensic UX (Circuit Breaker & X-Ray Mode)

## 1. Visión General
El Hito 4.3 dota a WorkGraph OS de una **transparencia radical**. Mientras que la mayoría de las herramientas de IA ocultan sus procesos, Forensic UX los expone bajo demanda y detiene el sistema ante infracciones críticas, garantizando que el usuario siempre mantenga el control sobre la verdad del grafo.

## 2. El Circuit Breaker Lógico (Freno de Emergencia)

### ¿Qué es?
Un mecanismo de seguridad que detiene inmediatamente la ejecución de la IA si esta intenta violar una **Invariante (PIN)** o si se detecta una falta de integridad en los datos del contexto.

### Funcionamiento Forense
1.  **Detección**: El `Verifier.ts` identifica una severidad `CRITICAL`.
2.  **Excepción**: Lanza un `LogicCircuitBreakerError`.
3.  **UI de Bloqueo**: Se despliega la "Pantalla Roja de la Muerte" (`CircuitBreaker.tsx`), que bloquea la interacción hasta que el error sea reconocido y remediado.
4.  **Traceability**: Muestra el código de error exacto (`PIN_CONFIDENCE_LOW`, `INTEGRITY_FAIL`, etc.) y el ID del nodo afectado.

## 3. Modo Rayos X (X-Ray Mode)

### ¿Qué es?
Una visualización "bajo el capó" que permite ver la estructura ósea del contenido generado. Es la máxima expresión de la **Sinceridad Técnica**.

### Activación
- Se activa manteniendo la tecla **ALT** mientras se visualiza un documento en el `SmartViewer`.

### Características Visuales
- **Atenuación**: El texto generado se vuelve traslúcido.
- **Trazado de Evidencias**: Aparecen conexiones visuales (cables de datos) que unen los párrafos con los nodos originales del grafo (Cajas Verdes).
- **Metadatos Vivos**: Muestra en tiempo real la confianza de la fuente y el hash de integridad del recibo de compilación.

## 4. Impacto en la Confianza
Forensic UX elimina el "miedo a la caja negra". El usuario no necesita confiar en la IA; puede ver, verificar y frenar su proceso de pensamiento en cualquier momento.

---
*Este hito refuerza el pilar de Honestidad de WorkGraph OS, transformándolo de una herramienta de escritura a un sistema operativo de conocimiento auditable.*
