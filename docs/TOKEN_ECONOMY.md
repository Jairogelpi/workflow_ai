# 💸 Token Economy System (Gate 12)

## Overview
The **Token Economy** is the financial backbone of Axiom Link-OS. It transforms AI operations from opaque costs into a transparent, real-time market.
Instead of hardcoded "estimates," the system connects to **OpenRouter's Market API** to fetch live pricing and records every transaction in a cryptographic quality ledger (`token_ledger`).

## Core Components

### 1. The Price Registry & SmartRouter
The system uses a intelligent routing logic:
- **PriceRegistry**: On app launch, it fetches `https://openrouter.ai/api/v1/models` and syncs live rates.
- **SmartRouter**: Dynamically selects the optimal model based on the **Task Tier**:
    - `REFLEX`: Fast, cost-effective (e.g., `gpt-4o-mini`) for basic summaries.
    - `REASONING`: High-precision logic (e.g., `gpt-4o`) for architecture and coding.
    - `CREATIVE`: Nuanced language (e.g., `claude-3.5-sonnet`) for strategy and personas.

### 2. The Ledger (`supabase/migrations/gate12_token_economy.sql`)
A PostgreSQL table `token_ledger` acts as the source of truth for billing.
- **Metrics**: Tracks input/output tokens, real cost, and **Savings Index** (vs GPT-4o reference baseline).

### 3. The Unified Gateway (`src/kernel/llm/gateway.ts`)
All AI traffic is strictly typed and metered.
- **Multimodal Support**: Natively handles images along with text.
- **Async Billing**: Costs are calculated and logged after response completion to ensure zero latency.

### 4. Budget HUD
Injected into the Root Layout for real-time visibility of AI spend and savings.

## Usage

### In Code (Kernel Bridge)
```typescript
import { generateText } from '@/kernel/llm/gateway';

const response = await generateText(
  "System Prompt", 
  "User Prompt", 
  'REASONING', // TaskTier
  undefined, // Tools
  images,    // Optional images
  projectId  // Required for ledger attribution
);
```

## Economic Safeguards
- **Predictive Estimation**: `predictCost` allows for pre-flight budget checks before executing heavy tasks.
- **Fallback Pricing**: Ensures system stability even if the live market API is unreachable.
