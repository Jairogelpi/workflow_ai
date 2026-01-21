import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'src/content/index.ts'),
                background: resolve(__dirname, 'src/background/index.ts'),
            },
            output: {
                entryFileNames: '[name].js',
            },
        },
    },
});
