import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    // Load env file from the root directory
    const env = loadEnv(mode, resolve(__dirname, '..'), '');

    return {
        build: {
            outDir: 'dist',
            rollupOptions: {
                input: {
                    content: resolve(__dirname, 'src/content/index.ts'),
                    background: resolve(__dirname, 'src/background/index.ts'),
                    popup: resolve(__dirname, 'index.html'),
                },
                output: {
                    entryFileNames: '[name].js',
                },
            },
        },
        define: {
            'process.env.SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
            'process.env.SUPABASE_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        }
    };
});
