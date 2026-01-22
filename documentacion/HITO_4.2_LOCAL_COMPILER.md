# Hito 4.2: Local Compiler (Universal BYOE - Privacy Mode)

## 1. Visión General
El Hito 4.2 introduce la capacidad de **Soberanía Cognitiva** total. WorkGraph OS ahora es compatible con cualquier endpoint local o remoto que siga el estándar de OpenAI, permitiendo que los datos de pensamiento y redacción nunca salgan de la infraestructura del usuario.

## 2. Arquitectura Universal BYOE (Bring Your Own Endpoint)

### Capa de Transporte Adaptativa
El `LLM Gateway` se ha extendido para soportar el proveedor `local`. A diferencia de los proveedores fijos, el modo local permite inyectar una `baseUrl` personalizada.

**Flujo de Datos Local:**
1.  **User UI**: Configura `http://localhost:11434/v1` (Ollama) o similar.
2.  **Gateway**: Activa el adaptador `callCustomOpenAI`.
3.  **Local LLM**: Recibe la petición directamente en la red local del usuario.
4.  **Zero Cloud**: No se envían tokens a proveedores externos (OpenAI, Gemini).

## 3. Seguridad y Validación

### Verificación de Estándares
Para evitar configuraciones erróneas, la interfaz incluye un botón de **"Verificar Conexión"**.
- El sistema realiza una llamada de prueba a `${baseUrl}/models`.
- Solo si el endpoint responde con un código de éxito (Standard OpenAI Compliance), el sistema marca el motor como listo para usar.

### Privacidad por Diseño
- Las API Keys locales (si existen) y las URLs se almacenan exclusivamente en el `localStorage` del navegador.
- En modo **Local + High Fidelity**, WorkGraph OS se convierte en una caja negra de inteligencia privada.

## 4. Configuración
Para usar un modelo local (ej. Ollama):
1. Descarga Ollama y ejecuta un modelo (ej. `ollama run llama3`).
2. En WorkGraph Settings, selecciona **"Custom / Local Model"**.
3. Asegura que el endpoint es `http://localhost:11434/v1`.
4. Haz clic en **Verificar** y ¡listo!
