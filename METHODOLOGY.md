# 📖 WorkGraph OS: Operative Methodology

This guide explains how to interact with Antigravity using the newly established Canonical Kernel.

## 1. How it Works
The system is designed so that the AI assistant (Antigravity) is **anchored** by the files in this repository. Whenever you start a conversation, the assistant synchronized with:
1.  **PROJECT_CHARTER.md**: The supreme rule.
2.  **ANTIGRAVITY_SYSTEM.md**: The behavioral protocol.
3.  **/canon/**: The technical and visionary source of truth.

## 2. The Interaction Loop (The "Preflight" Cycle)
To work on the project, we follow a strict sequential cycle based on the Roadmap.

### Step A: The Preflight (Decision)
You or the AI proposes a task. Before coding, a `PREFLIGHT-[ID].md` must be created using the `PREFLIGHT_TEMPLATE.md`.
- **User Prompt**: "Antigravity, let's start Hito 0.1. Prepare the Preflight."
- **AI Action**: Creates the plan, checks invariants, and assigns the Roadmap Hito.

### Step B: Execution (Action)
Once you approve the Preflight, the implementation starts.
- **AI Action**: Writes code, enforces the Stack (`01_stack.md`), and adheres to Invariants (`03_invariants.md`).
- **Check**: The AI runs `npm run check` to ensure zero technical debt.

### Step C: Verification (The Gate)
Before closing the task, the work must pass the **Definition of Done**.
- **AI Action**: Updates `ROADMAP.yml` from `pending` to `done` and documents the work **node-by-node**.

## 3. How to ask questions
- **"What is our rule for X?"**: I will cite `/canon/03_invariants.md`.
- **"Where are we in the project?"**: I will read `ROADMAP.yml`.
- **"Can we use library Y?"**: I will check `/canon/01_stack.md` and refuse if it's not there.

## 4. The Golden Rule of Communication
If you see me deviating or "guessing", just say: **"Follow the Canon."** I will immediately stop and re-sync with the files.

---
*Ready to operate. Use the command: "Start Hito [ID]" to begin.*
