import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify'; // Optional hygiene but recommended

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PARSE_URL') {
        handleParseRequest(message.url, sendResponse);
        return true; // Keep channel open for async response
    }
});

async function handleParseRequest(url: string, sendResponse: (response: any) => void) {
    try {
        console.log(`[Offscreen] Parsing requested for: ${url}`);

        // 1. Fetch Raw HTML
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const html = await response.text();

        // 2. Parse DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 3. Extract Readability Metadata
        const reader = new Readability(doc);
        const article = reader.parse();

        if (!article) {
            throw new Error('Readability failed to parse content');
        }

        // 4. Extract Top Images (for AI Context)
        const images = Array.from(doc.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src.startsWith('http') && !src.includes('icon') && !src.includes('logo'))
            .slice(0, 5);

        console.log(`[Offscreen] Success. Title: ${article.title}`);

        sendResponse({
            success: true,
            data: {
                title: article.title,
                content: article.textContent, // Plain text for AI
                html: DOMPurify.sanitize(article.content || ''), // HTML for Side Panel Viewer
                excerpt: article.excerpt,
                byline: article.byline,
                images: images,
                url: url
            }
        });

    } catch (error) {
        console.error('[Offscreen] Parse failed:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
