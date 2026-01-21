
import { ManifestTemplate, BaseTemplateData } from './types';

export interface CodeTemplateData extends BaseTemplateData {
    language: string;
    code: string;
    filename?: string;
}

/**
 * Renders a Code Manifest (Source File).
 */
export const CodeManifest: ManifestTemplate<CodeTemplateData> = {
    name: 'CodeManifest',
    render: (data) => {
        const header = `/**\n * Source: ${data.filename || 'generated'}\n * Description: ${data.title}\n */\n`;
        return `${header}\n\`\`\`${data.language}\n${data.code}\n\`\`\``;
    }
};
