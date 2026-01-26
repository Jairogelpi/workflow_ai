# 💸 Token Economy System (Gate 12)

## Overview
The **Token Economy** is the financial backbone of Axiom Link-OS. It transforms AI operations from opaque costs into a transparent, real-time market.
Instead of hardcoded "estimates," the system connects to **OpenRouter's Market API** to fetch live pricing and records every transaction in a cryptographic quality ledger (`token_ledger`).

## Core Components

### 1. The Price Registry (`src/kernel/economy/PriceRegistry.ts`)
The `PriceRegistry` is a singleton service that:
- **Boots**: On app launch, it fetches `https://openrouter.ai/api/v1/models`.
- **Syncs**: Updates internal lookup tables with the *exact* USD cost per 1M tokens for every model.
- **Selects**: Implements `selectModel(tier)` to choose the most efficient model for a task (e.g., `gpt-4o-mini` for basic summaries vs `claude-3.5-sonnet` for creative writing).

### 2. The Ledger (`supabase/migrations/gate12_token_economy.sql`)
A PostgreSQL table `token_ledger` acts as the source of truth.
- **Inputs**: `project_id`, `model`, `input_tokens`, `output_tokens`, `cost_usd`.
- **Value Add**: It automatically calculates `savings_usd` (The difference between the actual cost and what it *would* have cost using GPT-4o).

### 3. The Gateway (`src/kernel/llm/gateway.ts`)
All AI traffic flows through the Gateway.
- It intercepts every request.
- It calls `PriceRegistry.trackTransaction()`.
- It logs the cost *asynchronously* to Supabase, ensuring zero latency impact on the user.

### 4. Budget HUD (`src/components/ui/BudgetHUD.tsx`)
A generic UI component injected into the Root Layout.
- **Realtime**: Uses Supabase Realtime Subscriptions (`.on('INSERT', ...)`).
- **Features**: Live Ticker, Daily Spend vs. Limit, Savings Piggy Bank.

## Usage

### In Code
```typescript
import { generateText } from '@/kernel/llm/gateway';

// The Gateway handles all billing automatically.
// Just pass the 'projectId' to attribute the cost correctly.
const response = await generateText(
  "System Prompt", 
  "User Prompt", 
  "REASONING", // Tier: Determines model quality
  undefined, 
  undefined, 
  projectId // <--- BILLING CONTEXT
);
```

## Configuration
- **Budget Limit**: Configurable in `BudgetHUD` props (Default: $5.00/day).
- **Model Tiers**: Defined in `PriceRegistry.ts`.
