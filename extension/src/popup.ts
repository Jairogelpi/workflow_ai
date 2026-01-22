/**
 * WorkGraph Ingestor - Popup Logic
 */

const urlInput = document.getElementById('url') as HTMLInputElement;
const keyInput = document.getElementById('key') as HTMLInputElement;
const projectInput = document.getElementById('project') as HTMLInputElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Load existing settings
chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'projectId'], (result) => {
    if (result.supabaseUrl) urlInput.value = result.supabaseUrl;
    if (result.supabaseKey) keyInput.value = result.supabaseKey;
    if (result.projectId) projectInput.value = result.projectId;
});

// Save settings
saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const key = keyInput.value.trim();
    const project = projectInput.value.trim();

    if (!url || !key) {
        alert('Please fill in both URL and Key');
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
