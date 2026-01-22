# Hito 3.2: Staleness Detection

## Resumen
Sistema de detección de evidencia obsoleta que implementa tracking de edad y alertas de invalidación.

## Gate
> Evidence age tracking active.

## Implementación Técnica

### 1. Schema Changes (`migrations/001_gate7_schema.sql`)

```sql
ALTER TABLE work_nodes ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT FALSE;
ALTER TABLE work_nodes ADD COLUMN IF NOT EXISTS staleness_reason TEXT;
ALTER TABLE work_nodes ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP;
```

### 2. Kernel Logic (`digest_engine.ts`)

```typescript
/**
 * Marca un nodo como obsoleto por diversas razones:
 * - Edad > umbral configurado
 * - Fuente externa actualizada
 * - Evidence invalidada por nueva información
 */
function markStale(nodeId: NodeId, reason: string): void {
    // Actualiza is_stale = true
    // Registra staleness_reason
    // Propaga warning a nodos dependientes
}
```

### 3. Staleness Rules

| Tipo de Nodo | Umbral de Obsolescencia | Acción |
|--------------|-------------------------|--------|
| `evidence` (web) | 30 días | Warning visual |
| `evidence` (doc) | 90 días | Auto-archive |
| `source` (link) | 7 días | Re-validate |
| `claim` | Never | Manual only |

### 4. Visual Indicators

- **Warning Badge**: Ícono de reloj en nodos stale
- **Glow Effect**: Borde naranja pulsante
- **Tooltip**: "Esta evidencia tiene 45 días. Considera revalidar."

### 5. Observability Integration

```typescript
traceSpan('staleness.check', { nodeId, ageInDays }, async () => {
    if (ageInDays > threshold) {
        markStale(nodeId, `Age exceeded: ${ageInDays} days`);
    }
});
```

## Evidence Nodes
- `src/kernel/digest_engine.ts`
- `src/kernel/observability.ts`
- `supabase/migrations/001_gate7_schema.sql`

## Status: ✅ DONE
