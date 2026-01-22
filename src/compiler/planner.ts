import { Plan } from './types';
import { generateText } from '../kernel/llm/gateway';
import { traceSpan } from '../kernel/observability';

const PLANNER_SYSTEM_PROMPT = `
Eres el Arquitecto de WorkGraph OS. Tu trabajo es descomponer objetivos complejos en un Plan de Ejecución estructurado.
Devuelve SOLO un JSON válido con esta estructura exacta, sin markdown ni explicaciones adicionales:
{
  "goal": "string",
  "steps": [
    { 
      "id": "step-1", 
      "description": "Acción clara y atómica", 
      "required_context_keys": ["keywords", "para", "busqueda"] 
    }
  ]
}
`;

export async function createPlan(goal: string): Promise<Plan> {
    // Envolvemos todo el proceso del Planner en una traza
    return traceSpan('planner.create_plan', { goal }, async () => {
        console.log(`[PLANNER] Generando plan real para: "${goal}"...`);

        try {
            const jsonOutput = await generateText(PLANNER_SYSTEM_PROMPT, `El objetivo del usuario es: "${goal}"`);

            // Limpieza básica por si el modelo incluye bloques de código \`\`\`json ... \`\`\`
            const cleanJson = jsonOutput.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedPlan = JSON.parse(cleanJson);

            // Aquí podrías validar con Zod si quieres ser estricto (recomendado)
            return parsedPlan as Plan;

        } catch (error) {
            console.error('[PLANNER] Fallo en la generación:', error);
            // Fallback elegante o re-throw
            throw error;
        }
    });
}
