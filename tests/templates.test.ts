
import { describe, it, expect } from 'vitest';
import { CodeManifest } from '../src/compiler/templates/code';
import { DocManifest } from '../src/compiler/templates/doc';
import { PlanManifest } from '../src/compiler/templates/plan';

describe('RLM Templates (Hito 1.2)', () => {

    it('should render a CodeManifest correctly', () => {
        const data = {
            title: 'Hello World Function',
            language: 'typescript',
            code: 'console.log("Hello");',
            filename: 'hello.ts'
        };

        const output = CodeManifest.render(data);

        expect(output).toContain('Source: hello.ts');
        expect(output).toContain('Hello World Function');
        expect(output).toContain('```typescript');
        expect(output).toContain('console.log("Hello");');
    });

    it('should render a DocManifest correctly', () => {
        const data = {
            title: 'Project Update',
            description: 'Weekly status',
            sections: [
                { title: 'Progress', content: 'Everything is fine.' },
                { title: 'Blockers', content: 'None.' }
            ]
        };

        const output = DocManifest.render(data);

        expect(output).toContain('# Project Update');
        expect(output).toContain('> Weekly status');
        expect(output).toContain('## Progress');
        expect(output).toContain('Everything is fine.');
    });

    it('should render a PlanManifest correctly', () => {
        const data = {
            title: 'Hito 1.2',
            goal: 'Implement Templates',
            steps: ['Create Types', 'Create Code Template', 'Create Plan Template']
        };

        const output = PlanManifest.render(data);

        expect(output).toContain('# PLAN: Hito 1.2');
        expect(output).toContain('**Goal**: Implement Templates');
        expect(output).toContain('1. [ ] Create Types');
        expect(output).toContain('3. [ ] Create Plan Template');
    });

});
