import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file from the root directory
    const env = loadEnv(mode, resolve(__dirname, '..'), '');

    return {
        plugins: [
            react(),
            {
                name: 'copy-manifest',
                writeBundle() {
                    copyFileSync(
                        resolve(__dirname, 'manifest.json'),
                        resolve(__dirname, 'dist/manifest.json')
                    );
                }
            }
        ],
        build: {
            outDir: 'dist',
            minify: false,
            sourcemap: false,
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/content/index.tsx'),
                    background: resolve(__dirname, 'src/background/index.ts'),
                    popup: resolve(__dirname, 'index.html'),
                    sidepanel: resolve(__dirname, 'sidepanel.html'),
                    offscreen: resolve(__dirname, 'offscreen.html'),
                },
                output: {
                    entryFileNames: '[name].js',
                },
            },
        },
    };
});
