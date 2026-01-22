import { traceSpan } from '../kernel/observability';
import { Plan, CompilerContext } from './types';
import { WorkNode, ArtifactNodeSchema } from '../canon/schema/ir';
import { CompilationReceipt, AssertionMap } from '../canon/schema/receipt';
import { NodeId } from '../canon/schema/primitives';
import { v4 as uuidv4 } from 'uuid';
import { createVersion, computeNodeHash, computeStableHash } from '../kernel/versioning';
import { DocManifest, DocTemplateData } from './templates/doc';

/**
 * The Assembler synthesizes the Plan and Retrieved Context into a final Artifact.
 * Now adds PCD (Proof-Carrying Data) via Receipts.
 */
import { generateText } from '../kernel/llm/gateway';

// Prompt de RLM: Escribe el presente, recordando el pasado (resumido), mirando al futuro.
const RLM_PROMPT = `
Eres un Motor de Redacción Recursiva (RLM).
ESTADO ACTUAL:
- Objetivo Global: {goal}
- Sección Actual: {currentStep}
- Contexto Inmediato: {contextData}

MEMORIA DE TRABAJO (Lo que ya has escrito):
{previousSectionDigest}

TU TAREA:
1. Escribe el contenido completo para la "Sección Actual".
2. Asegura la coherencia con la "Memoria de Trabajo".
3. NO repitas contenido.
4. Devuelve SOLO el contenido en Markdown.
`;

// Prompt para comprimir la memoria (TOON/Digest)
const DIGEST_PROMPT = `
Resume el siguiente texto en un "Digest" denso de información. 
Conserva hechos clave, decisiones y cifras. Elimina retórica.
Objetivo: Que la siguiente iteración de la IA entienda qué pasó aquí sin leerlo todo.
`;

export async function assembleRecursiveArtifact(plan: Plan, contextNodes: any[]): Promise<string> {
    let fullDocument = "";
    let previousDigest = "Inicio del documento.";

    // Bucle RLM: Iteramos sobre cada paso del plan
    for (const step of plan.steps) {
        console.log(`[RLM] Generando sección: ${step.id}...`);

        // 1. GENERAR (Tier: REASONING - Usamos el modelo listo)
        const sectionContent = await generateText(
            RLM_PROMPT
                .replace('{goal}', plan.goal)
                .replace('{currentStep}', step.description)
                // TOON: En realidad deberíamos filtrar, por ahora pasamos todo (mock)
                .replace('{contextData}', JSON.stringify(contextNodes.map(n => n.content).slice(0, 3)))
                .replace('{previousSectionDigest}', previousDigest),
            "Genera esta sección.",
            'REASONING' // <--- Gasto alto aquí para calidad
        );

        // 2. ACUMULAR
        fullDocument += `\n\n## ${step.description}\n\n${sectionContent}`;

        // 3. COMPRIMIR MEMORIA (Tier: EFFICIENCY - Usamos el modelo barato)
        // Esto es lo que permite longitud infinita. Nunca pasamos el texto completo al siguiente paso.
        const newDigest = await generateText(
            DIGEST_PROMPT,
            sectionContent,
            'EFFICIENCY' // <--- Ahorro masivo aquí
        );

        // Actualizamos la memoria rodante
        previousDigest = newDigest;
    }

    return fullDocument;
}

export async function assembleArtifact(plan: Plan, context: WorkNode[], compilerContext?: CompilerContext): Promise<WorkNode> {
    return traceSpan('assembler.assemble_artifact', { goal: plan.goal, context_size: context.length }, async () => {
        // Stub Assertion Map
        const assertionMap: AssertionMap = {};
        context.forEach(node => {
            if (node.type === 'claim' && node.id) {
                assertionMap[node.id as NodeId] = node.id as NodeId;
            }
        });

        // Use RLM instead of Template
        const content = await assembleRecursiveArtifact(plan, context);

        // Create Receipt
        const inputHash = computeStableHash({ goal: plan.goal, contextIds: context.map(n => n.id).sort() });

        const receipt: CompilationReceipt = {
            job_id: compilerContext?.jobId || uuidv4(),
            compiled_at: new Date().toISOString(),
            input_hash: inputHash, // Real stable hash
            assertion_map: assertionMap,
            token_usage: 0,
            latency_ms: 0
        };

        // Create the raw node
        const artifact: any = {
            id: uuidv4(),
            type: 'artifact',
            name: `Output: ${plan.goal}`,
            uri: 'memory://generated', // Virtual URI for now
            metadata: {
                origin: 'ai', // Compiler is AI usually
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: '',
                confidence: 0.9,
                validated: false,
                pin: false
            },
            receipt: receipt // Attach PCD
        };

        // Attach content
        (artifact as any)._content_debug = content;

        // Stamp it with Kernel Versioning
        artifact.metadata = createVersion(artifact);

        return artifact as WorkNode;
    });
}
