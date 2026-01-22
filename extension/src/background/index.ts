import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * WorkGraph Ingestor - Background Script (MV3)
 */

// Context Menu Initialization
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'save-to-workgraph',
        title: 'Save to WorkGraph',
        contexts: ['selection']
    });
});

// Listener for Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'save-to-workgraph' && info.selectionText) {
        await handleCapture(info.selectionText, tab);
    }
});

async function handleCapture(text: string, tab?: chrome.tabs.Tab) {
    // 1. Get credentials from storage
    const { supabaseUrl, supabaseKey, projectId } = await chrome.storage.local.get([
        'supabaseUrl',
        'supabaseKey',
        'projectId'
    ]);

    if (!supabaseUrl || !supabaseKey) {
        showNotification('WorkGraph: Error', 'Please set your Supabase credentials in the extension popup.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const targetProjectId = projectId || '00000000-0000-0000-0000-000000000000';

    // 2. Prepare WorkNode IR
    const nodeId = uuidv4();
    const now = new Date().toISOString();

    const node = {
        id: nodeId,
        project_id: targetProjectId,
        type: 'note', // Default type for web captures
        content: {
            id: nodeId,
            type: 'note',
            content: text,
            metadata: {
                created_at: now,
                updated_at: now,
                origin: 'human', // Captures are considered human intent
                version_hash: 'signed-by-extension', // Placeholder for background signing
                confidence: 1.0,
                validated: false,
                pin: false,
                source: tab?.url || 'web-capture'
            }
        },
        metadata: {
            source: tab?.url,
            title: tab?.title
        },
        updated_at: now
    };

    // 3. Upsert to Supabase
    try {
        const { error } = await supabase
            .from('work_nodes')
            .upsert(node);

        if (error) throw error;
        showNotification('WorkGraph: Saved', `Captured from: ${tab?.title || 'Web'}`);
    } catch (err: any) {
        console.error('Capture failed:', err);
        showNotification('WorkGraph: Sync Error', err.message);
    }
}

function showNotification(title: string, message: string) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'public/icon128.png',
        title,
        message,
        priority: 2
    });
}
