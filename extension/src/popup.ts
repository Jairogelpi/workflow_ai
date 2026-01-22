/**
 * WorkGraph Ingestor - Popup Logic
 */

const urlInput = document.getElementById('url') as HTMLInputElement;
const keyInput = document.getElementById('key') as HTMLInputElement;
const projectInput = document.getElementById('project') as HTMLInputElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Show defaults as placeholders
const defaultUrl = '';
const defaultKey = '';

urlInput.placeholder = defaultUrl || 'https://your-project.supabase.co';
keyInput.placeholder = 'Pre-configured (from .env)';

// Load existing settings
chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'projectId'], (result) => {
    urlInput.value = result.supabaseUrl || defaultUrl;
    keyInput.value = result.supabaseKey || (result.supabaseUrl ? result.supabaseKey : ''); // Only show key if manual URL is set or use empty for pre-conf
    if (result.projectId) projectInput.value = result.projectId;

    if (!result.supabaseUrl && defaultUrl) {
        statusDiv.textContent = 'Using environment defaults.';
    }
});

// Save settings
saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim() || defaultUrl;
    const key = keyInput.value.trim() || defaultKey;
    const project = projectInput.value.trim();

    if (!url || !key) {
        alert('Supabase URL or Key missing in both settings and .env');
        return;
    }

    chrome.storage.local.set({
        supabaseUrl: url,
        supabaseKey: key,
        projectId: project
    }, () => {
        statusDiv.textContent = 'Settings saved!';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 2000);
    });
});
