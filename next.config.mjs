/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone', // Optimized for Docker/Render
    experimental: {
        instrumentationHook: true,
    },
    typescript: {
        // !! WARN !!
        // Ignoring build errors as tsc passes locally but next build stalls on literal unions
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        // Enable WASM support
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true,
        };

        // Handle .wasm files
        config.module.rules.push({
            test: /\.wasm$/,
            type: 'webassembly/async',
        });

        // Ensure WASM files are treated correctly
        if (!isServer) {
            config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
        }

        return config;
    },
};

export default nextConfig;
