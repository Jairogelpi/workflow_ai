import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Material Design 3 Surface System
                surface: {
                    DEFAULT: '#FFFFFF',
                    dim: '#DED8E1',
                    bright: '#FDF7FF',
                    container: {
                        lowest: '#FFFFFF',
                        low: '#F7F2FA',
                        DEFAULT: '#F3EDF7',
                        high: '#ECE6F0',
                        highest: '#E6E0E9',
                    }
                },
                // Dark mode surfaces
                'surface-dark': {
                    DEFAULT: '#141218',
                    dim: '#141218',
                    bright: '#3B383E',
                    container: {
                        lowest: '#0F0D13',
                        low: '#1D1B20',
                        DEFAULT: '#211F26',
                        high: '#2B2930',
                        highest: '#36343B',
                    }
                },
                // Google Primary Blue
                primary: {
                    DEFAULT: '#0B57D0',
                    light: '#D3E3FD',
                    dark: '#A8C7FA',
                    container: '#D3E3FD',
                    'on-container': '#041E49',
                },
                // Secondary Teal
                secondary: {
                    DEFAULT: '#00639B',
                    light: '#C2E7FF',
                    container: '#C2E7FF',
                    'on-container': '#001D35',
                },
                // Semantic Node Colors (Axiom Palette)
                node: {
                    note: { bg: '#F8F9FA', text: '#3C4043', border: '#DADCE0' },
                    claim: { bg: '#E8F0FE', text: '#1967D2', border: '#4285F4' }, // Axiom Blue
                    evidence: { bg: '#E6F4EA', text: '#137333', border: '#34A853' }, // Axiom Green
                    decision: { bg: '#FEF7E0', text: '#B06000', border: '#FBBC04' }, // Axiom Yellow
                    problem: { bg: '#FCE8E6', text: '#C5221F', border: '#EA4335' }, // Axiom Red
                    idea: { bg: '#E6F4EA', text: '#137333', border: '#34A853' },
                    task: { bg: '#FAFAFA', text: '#3C4043', border: '#DADCE0' },
                    artifact: { bg: '#FFF7E0', text: '#B06000', border: '#FBBC04' },
                    assumption: { bg: '#FCE8E6', text: '#C5221F', border: '#EA4335' },
                    constraint: { bg: '#F1F3F4', text: '#3C4043', border: '#DADCE0' },
                    source: { bg: '#E8F0FE', text: '#1967D2', border: '#4285F4' },
                },
                // Dark mode node colors
                'node-dark': {
                    note: { bg: '#4A4458', text: '#E8DEF8', border: '#938F99' },
                    claim: { bg: '#004A77', text: '#C2E7FF', border: '#0077B6' },
                    evidence: { bg: '#0D5D2C', text: '#C4EED0', border: '#1B8A45' },
                    decision: { bg: '#594F05', text: '#FEF7C3', border: '#8D7E0A' },
                    problem: { bg: '#8C1D18', text: '#F9DEDC', border: '#C62828' },
                    idea: { bg: '#0D5D2C', text: '#E7F8ED', border: '#2E7D32' },
                    task: { bg: '#4A4458', text: '#E8DEF8', border: '#7E57C2' },
                    artifact: { bg: '#5D4037', text: '#FFE0B2', border: '#8D6E63' },
                    assumption: { bg: '#880E4F', text: '#FCE4EC', border: '#AD1457' },
                    constraint: { bg: '#4E342E', text: '#EFEBE9', border: '#795548' },
                    source: { bg: '#0D47A1', text: '#E3F2FD', border: '#1976D2' },
                },
                // Outline colors
                outline: {
                    DEFAULT: '#79747E',
                    variant: '#CAC4D0',
                }
            },
            backdropBlur: {
                xs: '2px',
                '3xl': '64px',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
                mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'elevation-2': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'elevation-3': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'elevation-4': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'elevation-5': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scale-in': 'scale-in 0.2s ease-out',
                'slide-up': 'slide-up 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                'scale-in': {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
