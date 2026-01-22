import { Plan, Step } from './types';
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
      "required_context_keys": ["keywords", "para", "busqueda"],
      "complexity": "simple" | "complex" 
    }
  ]
}
NOTA: Marca como "complex" cualquier paso que requiera múltiples sub-tareas o sea ambiguo.
`;

const MAX_RECURSION_DEPTH = 3;

export async function createPlan(goal: string, depth: number = 0): Promise<Plan> {
  // Envolvemos todo el proceso del Planner en una traza
  return traceSpan(`planner.create_plan.d${depth}`, { goal }, async () => {
    console.log(`[PLANNER] Generando plan real para: "${goal}" (Profundidad: ${depth})...`);

    if (depth > MAX_RECURSION_DEPTH) {
      console.warn('[PLANNER] Max recursion depth reached. Returning flat plan.');
    }

    try {
      const prompt = depth === 0
        ? `El objetivo del usuario es: "${goal}"`
        : `SUB-PLANIFICACIÓN: Desglosa el siguiente paso complejo en sub-tareas: "${goal}"`;

      const result = await generateText(PLANNER_SYSTEM_PROMPT, prompt);
      const jsonOutput = result.content;

      // Limpieza básica
      const cleanJson = jsonOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedPlan = JSON.parse(cleanJson) as Plan;

      // Recursión: Identificar pasos complejos y subdividirlos
      if (depth < MAX_RECURSION_DEPTH) {
        const expandedSteps: Step[] = [];

        for (const step of parsedPlan.steps) {
          if ((step as any).complexity === 'complex') {
            console.log(`[PLANNER] Subdividiendo paso complejo: "${step.description}"`);
            try {
              const subPlan = await createPlan(step.description, depth + 1);
              // Aplanar sub-pasos o anidarlos. Estrategia: Anidarlos en un campo 'substeps' si el tipo lo permite, 
              // o simplemente reemplazarlos inline.
              // Dado que 'Step' current definition might not support substeps, we assume simple replacement logic or extend Step type.
              // Para mantener compatibilidad, marcaremos 'substeps' en el objeto aunque TS se queje si no actualizamos el tipo.
              // Lo ideal es actualizar 'types.ts' primero, pero por ahora lo haremos dinámico.
              (step as any).substeps = subPlan.steps;
            } catch (err) {
              console.error(`[PLANNER] Fallo al subdividir paso "${step.description}"`, err);
            }
          }
          expandedSteps.push(step);
        }
        parsedPlan.steps = expandedSteps;
      }

      return parsedPlan;

    } catch (error) {
      console.error('[PLANNER] Fallo en la generación:', error);
      throw error;
    }
  });
}
