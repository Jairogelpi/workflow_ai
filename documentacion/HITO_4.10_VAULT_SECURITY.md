# Hito 4.10: Vault Security (E2E BYOK)

## Resumen
Sistema de **Bóveda de Secretos** para proteger las claves API del usuario (BYOK) mediante cifrado **AES-GCM** (estándar bancario). Las claves nunca se almacenan en texto plano.

## Componentes Implementados

### Vault
- **src/lib/security/vault.ts**: Clase `Vault` con métodos `encryptKey` y `decryptKey` usando Web Crypto API.

### Desencriptación JIT
- **src/kernel/llm/gateway.ts**: Adaptadores `callOpenAI`, `callGemini`, `callCustomOpenAI` descifran la clave solo durante la llamada.

### Sanitización de Logs
- **src/kernel/guards.ts**: Funciones `sanitizeLogs` y `secureLog` que redactan claves API en trazas y logs.

### Configuración
- **src/store/useSettingsStore.ts**: `encryptedKeys` y `masterSecret` para gestión segura de claves.

## Gate de Verificación
✅ Las claves API se almacenan cifradas y solo se descifran en memoria durante la llamada.

## Evidencia
- `src/lib/security/vault.ts`
- `src/kernel/guards.ts`
- `src/store/useSettingsStore.ts`
