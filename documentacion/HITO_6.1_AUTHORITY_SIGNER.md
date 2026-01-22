# Hito 6.1: Authority Signer (Ed25519)

## Resumen
Módulo de **firmas criptográficas Ed25519** para garantizar la autoría humana verificable e inmutable de los nodos del Canon.

## Arquitectura

### signer-core/
- **Cargo.toml**: Dependencias `ed25519-dalek`, `wasm-bindgen`, `base64`.
- **src/lib.rs**: Implementación de firmas Ed25519.

### Funciones Expuestas (WASM)

| Función | Descripción |
|---------|-------------|
| `generate_keypair()` | Genera par de claves Ed25519 (privada/pública en Base64) |
| `sign_node(hash, private_key)` | Firma el hash de un nodo con la clave privada |
| `verify_signature(hash, sig, public_key)` | Verifica la firma de un nodo |

## Uso desde TypeScript

```typescript
import init, { sign_node, verify_signature } from 'signer-core';

await init();

const result = JSON.parse(sign_node(nodeHash, privateKeyBase64));
console.log(result.signature); // Base64 encoded Ed25519 signature
```

## Gate de Verificación
✅ Las funciones `sign_node` y `verify_signature` funcionan con vectores de prueba conocidos.

## Evidencia
- `signer-core/src/lib.rs`
- `src/types/signer-core.d.ts`
