import { generateText } from './llm/gateway';
import { traceSpan } from './observability';

/**
 * RLM_COMPILER [2026]
 * Decompone la intención del usuario en una estructura jerárquica de pensamiento.
 */
export class RLMCompiler {
    static async compile(prompt: string) {
        return await traceSpan('rlm_compiler', { prompt_length: prompt.length }, async () => {
            const systemPrompt = `
ROLE:
You are the "RLM Architect". You take a project description and decompose it into a logical WorkGraph structure.

OUPUT (JSON ONLY):
{
  "pillars": [
    {
      "name": "Branch Name (e.g. Infrastructure)",
      "isCritical": boolean,
      "concepts": [
        { "type": "decision" | "claim" | "task" | "idea", "text": "Deep description of the thought" }
      ]
    }
  ]
}

RULES:
1. Max 4 pillars.
2. Each pillar should have 3-5 concepts.
3. Be specific and strategic.
`;

            const response = await generateText(systemPrompt, prompt, "REASONING");

            try {
                // Basic cleanup for LLM response
                const cleanJson = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJson);
            } catch (err) {
                console.error('[RLMCompiler] Failed to parse response:', err);
                return { pillars: [] };
            }
        });
    }
}
