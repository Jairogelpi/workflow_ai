import { traceSpan, auditStore, measureCost } from '../kernel/observability';
import { Plan, CompilerContext } from './types';
import { verifyBranch } from './verifier';
import { useGraphStore } from '../store/useGraphStore';
import { useSettingsStore } from '../store/useSettingsStore';
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

export async function assembleRecursiveArtifact(plan: Plan, contextNodes: any[], compilerContext?: CompilerContext): Promise<string> {
    let fullDocument = "";
    let previousDigest = "Inicio del documento.";
    // [Phase 11] Sensory Feedback: Start Assembly Log
    const { addRLMThought } = useGraphStore.getState();
    addRLMThought({ message: `Starting artifact assembly: ${plan.goal}`, type: 'info' });

    // Bucle RLM: Iteramos sobre cada paso del plan
    for (const step of plan.steps) {
        addRLMThought({ message: `Compiling section: ${step.description}`, type: 'reasoning' });

        // TOON: Real Topology-Based Context Filtering
        const filteredNodes = contextNodes.filter(node => {
            if (step.required_context_keys.length === 0) return true; // Fallback to all if no keys

            // Search keywords in node's primary text content
            const searchSource = [
                (node as any).statement,
                (node as any).content,
                (node as any).rationale,
                (node as any).rule,
                (node as any).premise,
                (node as any).title,
                (node as any).summary,
                (node as any).name
            ].filter(Boolean).join(' ').toLowerCase();

            return step.required_context_keys.some(k => searchSource.includes(k.toLowerCase()));
        }).slice(0, 10); // Cap to 10 nodes for context safety

        // 1.1 IDENTIFICAR Nodos Firmados (Firma de Autoridad - Hito 4.4)
        const signedNodes = filteredNodes.filter(n => n.metadata.human_signature);
        let signatureInstruction = "";
        if (signedNodes.length > 0) {
            signatureInstruction = `
### 🛡️ PACTO DE AUTORIDAD HUMANA (REGLA DE ORO)
Los siguientes nodos han sido SELLADOS por el HUMANO y son VERDAD ABSOLUTA:
${signedNodes.map(n => `- [ID: ${n.id}] ${n.type.toUpperCase()}`).join('\n')}

IMPORTANTE: NO puedes contradecir, cuestionar ni sugerir cambios a estos nodos. Tu redacción DEBE basarse estrictamente en estos "Invariantes" humanos.
`;
        }

        // 1.2 GENERAR (Tier: REASONING - Usamos el modelo listo)
        const start = performance.now();
        const sectionContent = await generateText(
            RLM_PROMPT
                .replace('{goal}', plan.goal)
                .replace('{currentStep}', step.description)
                .replace('{contextData}', JSON.stringify(filteredNodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    data: (n as any).raw || (n as any).digest || (n as any).content || (n as any).statement || (n as any).summary
                }))))
                .replace('{previousSectionDigest}', previousDigest + signatureInstruction),
            "Genera esta sección respetando los sellos humanos.",
            'REASONING' // <--- Gasto alto aquí para calidad
        );
        const end = performance.now();

        // 1.3 AUDITORÍA REACTIVA (Hito 4.5)
        // Simulamos el conteo de tokens (en producción vendría del gateway)
        const inputTokens = 1000;
        const outputTokens = sectionContent.length / 4;
        const cost = await measureCost(inputTokens, outputTokens, 'gpt-4o');
        const jobId = compilerContext?.jobId || 'local-job';

        auditStore.recordMetric({
            jobId,
            stepId: step.id,
            model: 'gpt-4o',
            tokens: { input: inputTokens, output: outputTokens },
            latency_ms: Math.round(end - start),
            cost_usd: cost,
            timestamp: new Date().toISOString()
        });

        // 1.4 CIRCUIT BREAKER REACTIVO (Hito 4.3 Integrated)
        // Verificamos esta rama específica antes de continuar
        // Si el verificador detecta una violación de un PIN, verifyBranch lanzará LogicCircuitBreakerError
        await verifyBranch(filteredNodes);

        // [Phase 7 Final] INJECT FORENSIC IDs
        // Each section gets a unique forensic ID for deep traceability
        const forensicId = `f-${step.id}-${Date.now().toString(36)}`;
        const evidenceRefs = filteredNodes.map(n => n.id).join(',');
        const signedNodeIds = signedNodes.map(n => n.id).join(',');

        // 2. ACUMULAR (with forensic metadata as HTML comment)
        fullDocument += `\n\n<!-- forensic:${forensicId} evidence:[${evidenceRefs}] signed:[${signedNodeIds}] -->\n## ${step.description}\n\n${sectionContent}`;

        // 3. COMPRIMIR MEMORIA (Tier: EFFICIENCY or REASONING based on qualityMode)
        // Esto es lo que permite longitud infinita.
        const { modelConfig } = useSettingsStore.getState();
        const digestionTier = modelConfig.qualityMode === 'high-fidelity' ? 'REASONING' : 'EFFICIENCY';

        addRLMThought({ message: `Digesting section for memory continuity...`, type: 'info' });
        const newDigest = await generateText(
            DIGEST_PROMPT,
            sectionContent,
            digestionTier
        );

        // Actualizamos la memoria rodante
        previousDigest = newDigest;
    }

    addRLMThought({ message: `Artifact composition successful.`, type: 'success' });
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
        const content = await assembleRecursiveArtifact(plan, context, compilerContext);

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
