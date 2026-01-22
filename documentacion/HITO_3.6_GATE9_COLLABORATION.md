# Hito 3.6: Gate 9 - Gobernanza Semántica de Cambios (Collaboration)

## 🎯 Objetivo: Colaboración con Integridad
Transformar el WorkGraph OS en una plataforma colaborativa donde los cambios no solo se fusionan, sino que se validan semánticamente para evitar que un editor rompa la lógica del proyecto (Invariantes).

## 🛠️ Implementación Técnica

### 1. Change Requests (CR) & RBAC
- **Nivel de Base de Datos**: Nueva tabla `change_requests` para gestionar propuestas de cambios entre ramas/proyectos.
- **RBAC Granular**: Tabla `project_members` con roles (`viewer`, `editor`, `maintainer`, `owner`) y políticas RLS ajustadas.
- **Discusión Contextual**: Tabla `change_comments` con soporte para selección de rangos en nodos.

### 2. AI Mediator: RLM-Powered Consensus (Cost-Optimized Intelligence)
Se ha implementado el **MediatorAgent** utilizando la arquitectura **RLM (Recursive Logic Model)**:
- **Fase 1: Verificación Determinista ($0 cost)**: Usa el `Verifier.verifyBranch()` para encontrar exactamente qué reglas (PINs) se rompieron sin usar la IA.
- **Fase 2: Recuperación Selectiva**: Solo se envía a la IA el "culpable" y la "regla", no todo el proyecto, reduciendo drásticamente el uso de tokens.
- **Fase 3: Explicación Diplomática (Mini Model)**: Se utiliza un modelo ligero (GPT-4o-mini) para humanizar el error, ya que el razonamiento lógico ya lo hizo el código.

### 3. El Guardian Lógico (Verifier.ts)
- **`verifyBranch()`**: Nueva capacidad para validar estados de rama arbitrarios antes de la fusión, garantizando que los contratos de invariancia se respeten matemáticamente.

### 4. Presencia en Tiempo Real
- **`PresenceIndicator.tsx`**: Componente de baja latencia para visualización de co-ediciónactiva.

## 🚀 Impacto en el Producto
- **Seguridad Lógica**: Los proyectos mantienen su coherencia incluso con múltiples editores.
- **Auditabilidad**: Cada decisión de fusión queda registrada con su reporte de integridad.
- **Transparencia**: Mejora la experiencia de usuario con indicadores de presencia viva.

---
*Estado: Completado y Verificado mediante Simulación de Lógica.*
