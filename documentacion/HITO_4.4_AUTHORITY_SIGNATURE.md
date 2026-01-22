# Hito 4.4: Firma de Autoridad (The Human-AI Pact)

## 1. El Concepto: Soberanía del Arquitecto
En WorkGraph OS, la IA no es un reemplazo del humano, sino su herramienta. El Hito 4.4 introduce la **Firma de Autoridad**, un mecanismo criptográfico que permite al usuario sellar nodos como "Verdad Inviolable".

## 2. El Sello de Cera (Wax Seal)

### ¿Cómo funciona?
Cuando un usuario firma un nodo:
1.  **Snapshot Criptográfico**: El sistema genera un hash del contenido actual y lo guarda en `metadata.human_signature`.
2.  **Bloqueo de Escritura**: El `NodeEditor` deshabilita la edición del nodo mientras el sello esté intacto.
3.  **Sanctity en RLM**: El Assembler inyecta instrucciones explícitas a la IA: "Este nodo es Verdad Absoluta. No puedes alterarlo ni sugerir cambios".

## 3. Integración con el Circuit Breaker

### Detección de Sellos Rotos
El `Verifier.ts` realiza una comprobación constante. Si el contenido de un nodo firmado no coincide con su hash de firma (ej. debido a un error del sistema o un intento de manipulación externa), se activa el código `BROKEN_SIGNATURE_SEAL`.

### Pantalla de Integridad
Si el sello se rompe, el sistema visualiza una alerta de **"Integridad Comprometedora"**. Para recuperar el control, el usuario debe realizar la acción de "Romper Sello" (Fricción Alta), reconociendo explícitamente la alteración.

## 4. Flujo de Trabajo Recomendado
- **Draft**: Deja que la IA genere ideas y claims borrosos.
- **Validación**: Revisa el contenido.
- **Firma**: Cuando un punto es crítico (PIN), fírmalo. A partir de ese momento, el sistema se construye sobre esa base de hormigón.

---
*Este hito cierra el círculo de la Fase 4: Sinceridad Técnica. El humano firma, la máquina obedece.*
