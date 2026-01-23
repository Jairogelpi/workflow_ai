import json
import sys

filepath = r'c:\Users\jairo.gelpi\Downloads\paginas_web (12).json'

with open(filepath, 'r', encoding='utf-8') as f:
    wf = json.load(f)

nodes = wf['nodes']
connections = wf['connections']

# --- 1. PROMPTS & ASSETS ---

PLANNER_PROMPT = """Role: Eres el "PLANNER / ORQUESTADOR" de una fábrica de webs automatizada.
Tu misión es analizar el "Golden Record" de un negocio y decidir qué roles profesionales deben intervenir para mejorar el ClientSEOBundle.

INPUT:
- seo_bundle_base: El objeto JSON generado por el Golden Record.

REGLAS DE DECISIÓN:
1. Director Creativo: Siempre si el tono es genérico o falta brand_voice.
2. Marketing: Si brand.sameAs < 2 o falta propuesta de valor clara.
3. CRO: Si content.cta_primary falta o no es orientada a acción.
4. SEO Expert: Si falta content.semantic_hierarchy o keywords.
5. Front Engineer: Si hay cambios estructurales necesarios (Astro componentes).

SALIDA (STRICT JSON):
{
  "tasks": [
    {
      "role": "string (creative_director|marketing_expert|cro_expert|seo_expert|front_engineer)",
      "target": "string (path del campo a mejorar)",
      "why": "breve explicación"
    }
  ]
}"""

ROLE_SYSTEM_PROMPT = """Role: {role_name}.
Misión: {mission}.
Tarea: Recibes un bundle base y debes proponer mejoras de su área mediante patches.
REGLA: Devuelve SOLO patches en este formato: {"patches": [{"op": "set", "path": "...", "value": "..."}]}. No inventes hechos."""

APPLY_PATCHES_JS = """/**
 * APPLY PATCHES - Integrator Node
 * Recibe:
 * - base: El seo_bundle original (Golden Record)
 * - patches: Array de parches de todos los roles
 */

const items = $input.all();
const base = items[0].json.seo_bundle || items[0].json; // Ajuste de entrada

function setPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) current[key] = {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

let integratedBundle = JSON.parse(JSON.stringify(base));

items.forEach(item => {
  if (item.json.patches && Array.isArray(item.json.patches)) {
    item.json.patches.forEach(patch => {
      if (patch.op === 'set') {
        setPath(integratedBundle, patch.path, patch.value);
      }
    });
  }
});

return { json: { seo_bundle: integratedBundle, status: "integrated" } };"""

# --- 2. MODIFY EXISTING NODES ---

# Modify "Agente CRO"
for node in nodes:
    if node['name'] == 'Agente CRO':
        node['parameters']['responses']['values'][0]['content'] = ROLE_SYSTEM_PROMPT.format(
            role_name="Especialista en CRO",
            mission="Optimizar CTA y estructura AIDA/PAS"
        )
        node['name'] = 'Role: CRO Expert'

# --- 3. ADD NEW NODES ---

new_nodes = [
    {
        "parameters": {
            "modelId": {"__rl": True, "value": "chatgpt-4o-latest", "mode": "list"},
            "responses": {"values": [{"role": "system", "content": PLANNER_PROMPT}, {"content": "={{ JSON.stringify($json) }}"}]},
            "options": {}
        },
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 2.1,
        "position": [10200, 1456],
        "id": "planner-node-id",
        "name": "Planner"
    },
    {
        "parameters": {
            "modelId": {"__rl": True, "value": "chatgpt-4o-latest", "mode": "list"},
            "responses": {"values": [{"role": "system", "content": ROLE_SYSTEM_PROMPT.format(role_name="Director Creativo", mission="Definir brand voice y estilo de titulares")}, {"content": "={{ JSON.stringify($('Message a model (Golden Record)').first().json) }}"}]},
            "options": {}
        },
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 2.1,
        "position": [10672, 1256],
        "id": "director-creativo-id",
        "name": "Role: Director Creativo"
    },
    {
        "parameters": {
            "modelId": {"__rl": True, "value": "chatgpt-4o-latest", "mode": "list"},
            "responses": {"values": [{"role": "system", "content": ROLE_SYSTEM_PROMPT.format(role_name="Marketing Expert", mission="Propuesta de valor y objeciones")}, {"content": "={{ JSON.stringify($('Message a model (Golden Record)').first().json) }}"}]},
            "options": {}
        },
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 2.1,
        "position": [10672, 1656],
        "id": "marketing-expert-id",
        "name": "Role: Marketing Expert"
    },
    {
        "parameters": {
            "modelId": {"__rl": True, "value": "chatgpt-4o-latest", "mode": "list"},
            "responses": {"values": [{"role": "system", "content": ROLE_SYSTEM_PROMPT.format(role_name="SEO Expert", mission="Entidades y jerarquía semántica")}, {"content": "={{ JSON.stringify($('Message a model (Golden Record)').first().json) }}"}]},
            "options": {}
        },
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 2.1,
        "position": [10672, 1856],
        "id": "seo-expert-id",
        "name": "Role: SEO Expert"
    },
    {
        "parameters": {
            "jsCode": APPLY_PATCHES_JS
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [11000, 1456],
        "id": "apply-patches-id",
        "name": "Apply Patches (Integrator)"
    }
]

nodes.extend(new_nodes)

# --- 4. UPDATE CONNECTIONS ---

# Delete old connection: Golden Record -> Code in JavaScript5
if "Message a model (Golden Record)" in connections:
    connections["Message a model (Golden Record)"]["main"][0] = []

# New Connections:
# Golden Record -> Planner
connections["Message a model (Golden Record)"]["main"][0].append({"node": "Planner", "type": "main", "index": 0})

# Planner -> Roles
connections["Planner"] = {"main": [[]]}
roles = ["Role: CRO Expert", "Role: Director Creativo", "Role: Marketing Expert", "Role: SEO Expert"]
for role in roles:
    connections["Planner"]["main"][0].append({"node": role, "type": "main", "index": 0})

# Roles -> Apply Patches
for role in roles:
    if role not in connections: connections[role] = {"main": [[]]}
    connections[role]["main"][0] = [{"node": "Apply Patches (Integrator)", "type": "main", "index": 0}]

# Apply Patches -> Code in JavaScript5 (Schema)
connections["Apply Patches (Integrator)"] = {"main": [[{"node": "Code in JavaScript5", "type": "main", "index": 0}]]}

# Clean up redundant nodes (e.g., the old "Message a model" which was a monolithic integrator)
# We can keep them disconnected or remove them. For now, let's keep it simple.

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)

print("Workflow modified successfully.")
