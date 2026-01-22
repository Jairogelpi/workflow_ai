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

declare const process: {
    env: {
        SUPABASE_URL: string;
        SUPABASE_KEY: string;
    }
};

async function handleCapture(text: string, tab?: chrome.tabs.Tab) {
    // 1. Get credentials from storage or use defaults from .env
    const result = await chrome.storage.local.get([
        'supabaseUrl',
        'supabaseKey',
        'projectId'
    ]);

    const supabaseUrl = result.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseKey = result.supabaseKey || process.env.SUPABASE_KEY;
    const projectId = result.projectId;

    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        showNotification('WorkGraph: Error', 'Supabase URL missing or invalid. Please check settings.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const targetProjectId = projectId || '00000000-0000-0000-0000-000000000000';

    console.log('WorkGraph: Capture starting...', { text, targetProjectId });

    // 2. Request Rich Context from Content Script
    let contextData = { context: null, title: tab?.title || 'Unknown Webpage' };
    if (tab?.id) {
        try {
            // Promise-based messaging with timeout
            const response = await Promise.race([
                chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION_CONTEXT' }),
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 500))
            ]) as any;

            if (response) contextData = response;
        } catch (e) {
            console.warn('WorkGraph: Could not get rich context, using tab info fallback.', e);
        }
    }

    // 3. Prepare WorkNode IR (Internal Representation)
    const nodeId = uuidv4();
    const now = new Date().toISOString();

    const workNodeIR = {
        id: nodeId,
        type: 'note' as const,
        content: text,
        metadata: {
            created_at: now,
            updated_at: now,
            accessed_at: now, // Explicit evidence timestamp
            origin: 'human' as const,
            version_hash: 'signed-by-extension',
            confidence: 1.0,
            validated: false,
            pin: false,
            source: tab?.url || 'web-capture',
            source_title: contextData.title,
            snippet_context: contextData.context // Surrounding text
        }
    };

    // 4. Prepare DB Record (Flattened for SQL columns)
    const dbRecord = {
        id: nodeId,
        project_id: targetProjectId,
        type: 'note',
        content: workNodeIR,
        confidence: 1.0,
        is_pinned: false,
        is_validated: false,
        origin: 'human',
        metadata: {
            source: tab?.url,
            title: contextData.title,
            accessed_at: now,
            snippet_context: contextData.context
        },
        current_version_hash: 'signed-by-extension',
        updated_at: now,
        deleted_at: null
    };

    // 4. Upsert to Supabase
    try {
        const { error, data } = await supabase
            .from('work_nodes')
            .upsert(dbRecord);

        if (error) {
            console.error('WorkGraph: Supabase Error', error);
            throw error;
        }

        console.log('WorkGraph: Capture successful!', data);
        showNotification('WorkGraph: Saved', `Captured from: ${tab?.title || 'Web'}`);
    } catch (err: any) {
        console.error('WorkGraph: Capture failed:', err);
        showNotification('WorkGraph: Sync Error', err.message || 'Check extension logs');
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
