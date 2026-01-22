# ETAPA 1: Planificador para cachear dependencias
FROM lukemathwalker/cargo-chef:latest-rust-1.75 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ETAPA 2: Constructor (Cacher)
FROM chef AS builder 
COPY --from=planner /app/recipe.json recipe.json
# Construimos solo las dependencias
RUN cargo chef cook --release --recipe-path recipe.json

# ETAPA 3: Compilación del código fuente
COPY . .
RUN cargo build --release --bin workgraph-ingestor

# ETAPA 4: Runtime de Producción (Seguridad Máxima)
FROM gcr.io/distroless/cc-debian12 AS runtime
WORKDIR /app

# Copiamos el binario optimizado
COPY --from=builder /app/target/release/workgraph-ingestor /app/ingestor

# Inyectamos observabilidad permanente
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4317"
ENV RUST_LOG="info"

EXPOSE 8080
ENTRYPOINT ["/app/ingestor"]
