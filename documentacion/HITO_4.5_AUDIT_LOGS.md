# Hito 4.5: Auditoría y Observabilidad Pública

## 1. El HUD del Ingeniero
En la visión de 2026, el usuario no es un simple receptor de texto, sino el **Operador** de una maquinaria compleja. Por ello, hemos expuesto la telemetría del sistema directamente en la UI forense.

## 2. Métricas por Sección (RLM Audit)
Gracias al nuevo `AuditStore`, el sistema ahora rastrea de forma granular:
- **Consumo de Tokens**: Entrada y salida por cada paso del plan.
- **Latencia Real**: Milisegundos exactos que tarda cada modelo en "pensar".
- **Coste Financiero**: Cálculo en tiempo real basado en las tarifas de mercado (OpenRouter sync) para mostrar el gasto usd por sección.

## 3. Integración en el Modo Rayos X
Al activar el modo X-Ray (**Alt**), el usuario ve el **Engineer HUD** en la esquina inferior. Este panel resume:
- `JOB_ID`: Identificador único de la sesión de compilación.
- `ASSERTIONS`: Número de conexiones lógicas verificadas en el grafo.
- `AUDIT_COST`: El coste acumulado de generar el documento actual.
- `AVG_LATENCY`: El rendimiento medio de procesamiento.

## 4. El "Caja Negra" Off
Esta funcionalidad garantiza que el usuario entienda exactamente qué está pagando y cómo se está utilizando su contexto. No hay procesos ocultos; la maquinaria es transparente.

---
*Hito 4.5: La verdad no solo se verifica, se audita en tiempo real.*
