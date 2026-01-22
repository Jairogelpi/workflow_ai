
import { generateText } from '../src/kernel/llm/gateway';
import { useSettingsStore } from '../src/store/useSettingsStore';

async function testRouting() {
    console.log("🔍 Verificando Enrutamiento a Endpoint Personalizado...");

    // 1. Configurar un provider local con un puerto inexistente
    useSettingsStore.getState().updateReasoning({
        provider: 'local',
        modelId: 'test-local-model',
        apiKey: 'test-key',
        baseUrl: 'http://localhost:9999/v1'
    });

    console.log("--- Intentando llamada a http://localhost:9999/v1 ---");
    try {
        await generateText("System", "User", "REASONING");
    } catch (e) {
        // Esperamos un error de conexión al puerto 9999
        if (e.message.includes("fetch failed") || e.message.includes("ECONNREFUSED") || e.message.includes("No se pudo contactar")) {
            console.log("✅ ÉXITO: El Gateway intentó contactar con el puerto 9999.");
        } else {
            console.error("❌ ERROR inesperado:", e.message);
        }
    }
}

testRouting().catch(console.error);
