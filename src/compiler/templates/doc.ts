
import { ManifestTemplate, BaseTemplateData } from './types';

export interface DocTemplateData extends BaseTemplateData {
    sections: { title: string; content: string }[];
}

/**
 * Renders a Documentation Manifest (Markdown Report).
 */
export const DocManifest: ManifestTemplate<DocTemplateData> = {
    name: 'DocManifest',
    render: (data) => {
        const frontmatter = [
            `# ${data.title}`,
            `> ${data.description || 'No description provided.'}`,
            '',
            '---'
        ].join('\n');

        const body = data.sections.map(section => `## ${section.title}\n${section.content}`).join('\n\n');

        return `${frontmatter}\n\n${body}`;
    }
};
