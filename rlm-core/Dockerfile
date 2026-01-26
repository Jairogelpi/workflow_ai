# RLM Core Dockerfile - Multi-stage build for native Rust extensions
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy the Rust neuro-hypervisor
COPY neuro-hypervisor/ neuro-hypervisor/

# Build the Rust extension
RUN cd neuro-hypervisor && cargo build --release

# Final Stage
FROM python:3.11-slim

WORKDIR /app

# Copy built extension
COPY --from=builder /app/neuro-hypervisor/target/release/libneuro_hypervisor.so ./rlm_core/neuro_hypervisor.so
# Note: On Linux it's .so, on Windows it's .pyd. Python's import will find .so

# Copy project files
COPY rlm-core/pyproject.toml .
COPY rlm-core/src/ rlm_core/

# Install dependencies (Llama-cpp-python etc.)
RUN pip install uv && uv pip install --system -e .

EXPOSE 8082

CMD ["uvicorn", "rlm_core.main:app", "--host", "0.0.0.0", "--port", "8082"]
