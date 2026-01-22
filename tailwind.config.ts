import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Colores semánticos para WorkGraph OS
                os: {
                    bg: '#020617',       // Fondo profundo
                    panel: '#0f172a',    // Paneles
                    border: '#1e293b',   // Bordes sutiles
                    accent: '#38bdf8',   // Azul eléctrico (Acción principal)
                    success: '#10b981',  // Verde (Verificado)
                    warning: '#f59e0b',  // Naranja (Pendiente)
                }
            },
            backdropBlur: {
                xs: '2px', // Desenfoque sutil
            },
            fontFamily: {
                // Prioridad a fuentes de sistema limpias
                sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
                mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
};
export default config;
