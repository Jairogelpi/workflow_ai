module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // 1. Core Strictness
        'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
        'no-debugger': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',

        // 2. TypeScript Type-Safety (Enterprise Grade)
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/require-await': 'error',

        // 3. React 19 & Next.js 15 Cleanliness
        'react/react-in-jsx-scope': 'off', // Not needed in React 17+
        'react/prop-types': 'off', // Use TS instead
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/self-closing-comp': 'error',

        // 4. Architectural Guardrails (The "Canon" rules)
        'import/no-default-export': 'error',
        'import/no-cycle': 'error', // Prevents graph-destroying circular deps
        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
                'newlines-between': 'always',
                alphabetize: { order: 'asc', caseInsensitive: true },
            },
        ],
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: 'openai',
                        message: 'Direct calls to AI providers are prohibited. Use the RLM Compiler wrapper.',
                    },
                    {
                        name: 'anthropic',
                        message: 'Direct calls to AI providers are prohibited. Use the RLM Compiler wrapper.',
                    },
                    {
                        name: '@google/generative-ai',
                        message: 'Direct calls to AI providers are prohibited. Use the RLM Compiler wrapper.',
                    },
                ],
            },
        ],

        // 5. Logic Leakage & Naming
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'variable',
                types: ['boolean'],
                format: ['PascalCase'],
                prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
            },
            {
                selector: 'interface',
                format: ['PascalCase'],
                prefix: ['I'],
            },
            {
                selector: 'typeAlias',
                format: ['PascalCase'],
            },
        ],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
}
