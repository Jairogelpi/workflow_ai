
import { ManifestTemplate, BaseTemplateData } from './types';

export interface PlanTemplateData extends BaseTemplateData {
    goal: string;
    steps: string[];
}

/**
 * Renders a Plan Manifest (Project Execution Plan).
 */
export const PlanManifest: ManifestTemplate<PlanTemplateData> = {
    name: 'PlanManifest',
    render: (data) => {
        return `# PLAN: ${data.title}\n**Goal**: ${data.goal}\n\n## Steps\n${data.steps.map((s, i) => `${i + 1}. [ ] ${s}`).join('\n')}`;
    }
};
