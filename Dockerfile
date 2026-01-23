# Multi-stage build for WorkGraph OS with Rust/WASM support
FROM rust:1.75 AS rust-builder

WORKDIR /build

# Install wasm-pack
RUN cargo install wasm-pack

# Copy Rust projects
COPY antigravity-engine ./antigravity-engine
COPY workgraph-worker ./workgraph-worker

# Build WASM module
WORKDIR /build/antigravity-engine
RUN wasm-pack build --target web

# Build worker (optional)
WORKDIR /build/workgraph-worker
RUN cargo build --release

# Node.js stage
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and WASM artifacts
COPY . .
COPY --from=rust-builder /build/antigravity-engine/pkg ./antigravity-engine/pkg

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=node-builder /app/public ./public
COPY --from=node-builder /app/.next/standalone ./
COPY --from=node-builder /app/.next/static ./.next/static
COPY --from=node-builder /app/antigravity-engine/pkg ./antigravity-engine/pkg

EXPOSE 3000

CMD ["node", "server.js"]
