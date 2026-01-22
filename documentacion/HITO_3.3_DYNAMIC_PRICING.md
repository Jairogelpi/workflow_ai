# HITO 3.3: Dynamic Pricing Engine (Real-Time Audit)

> **Status**: Implemented
> **Module**: `src/kernel/observability.ts`
> **Source**: OpenRouter API

## 1. Overview
The Gate 7 promise involves "Auditable Costs". To ensure these costs reflect reality, we moved away from hardcoded static files to a **Dynamic Pricing Engine**. 

We leverage the [OpenRouter API](https://openrouter.ai/api/v1/models) which acts as a normalized aggregator, providing real-time pricing for hundreds of models (OpenAI, Anthropic, Gemini, Mistral, etc.).

## 2. Architecture: `PriceRegistry`
We implemented a Singleton class `PriceRegistry` embedded in the kernel:

### 2.1 The "Oracle" Logic
1.  **Lazy Sync**: The registry attempts to sync with the market API every 24 hours.
2.  **Normalization**: It maps `openai/gpt-4o` to both the full ID and the short ID `gpt-4o` for ease of use.
3.  **Fallback Safety**: If the API is unreachable (offline/timeout), it falls back to a hardcoded "Safety Set" (GPT-4o, Sonnet, etc.) to prevent crashes.

### 2.2 Usage
```typescript
import { measureCost } from '@/kernel/observability';

// Now returns a Promise because it might trigger a sync
const cost = await measureCost(1500, 200, 'claude-3-5-sonnet');
console.log(\`Estimated Cost: $\${cost.toFixed(6)}\`);
```

## 3. Benefits
-   **Future Proof**: When GPT-5 launches, its price will be available automatically.
-   **Transparency**: The user always sees the *current market rate*, not a stale number from 2024.
-   **Performance**: Sync is non-blocking. Costs are calculated from RAM (Nano-latency).

## 4. Verification
Unit tests in `tests/observability.test.ts` verify:
-   Fallback mechanism working correctly.
-   Mock API integration (simulating OpenRouter response).
