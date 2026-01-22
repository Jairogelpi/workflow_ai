
import { createPlan } from '../src/compiler/planner';
import { assembleArtifact } from '../src/compiler/assembler'; // Assembler now uses RLM!
import { WorkNode } from '../src/canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';

async function runDemo() {
    console.log("🚀 Starting Smart Routing & RLM Demo...\n");

    // 1. Run Planner (Uses REASONING Tier by default)
    console.log("--- Step 1: Invoking Planner (Reasoning Tier) ---");
    try {
        const plan = await createPlan("Build a Dyson Sphere");
        console.log("✅ Plan Created.\n");

        // 2. Mock Context
        const mockContext: WorkNode[] = [
            { id: 'node-1', type: 'claim', content: { text: "Sun has energy" }, metadata: {} }
        ] as any;

        // 3. Run Assembler (Uses RLM Loop: Reasoning for write -> Efficiency for digest)
        console.log("--- Step 2: Invoking Assembler (RLM Loop) ---");
        await assembleArtifact(plan, mockContext, { jobId: uuidv4() });

    } catch (e) {
        console.error("EXPECTED ERROR (No Keys Configured):", e.message);
    }
}

runDemo().catch(console.error);
