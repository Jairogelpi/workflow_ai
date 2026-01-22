import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file from the root directory
    const env = loadEnv(mode, resolve(__dirname, '..'), '');

    return {
        plugins: [react()],
        build: {
            outDir: 'dist',
            minify: false,
            sourcemap: false,
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/content/index.tsx'),
                    background: resolve(__dirname, 'src/background/index.ts'),
                    popup: resolve(__dirname, 'index.html'),
                },
                output: {
                    entryFileNames: '[name].js',
                },
            },
        },
    };
});
