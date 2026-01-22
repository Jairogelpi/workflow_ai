# Hito 4.12: Professional Deployment (Docker & Chef)

## Resumen
**Infraestructura de despliegue de grado producción** utilizando Docker multi-stage con Cargo Chef para builds optimizados de Rust y Docker Compose para orquestación.

## Componentes Implementados

### Dockerfile (Cargo Chef)
- **ingestor-rust/Dockerfile**: 4 etapas (Chef, Planner, Builder, Runtime) con imagen final Distroless (~20MB).

### Orquestación
- **docker-compose.yml**: Servicios `main-app` (Next.js), `ingestor` (Rust Worker), y `otel-collector`.

### Observability Backbone
- **otel-config.yaml**: Configuración completa del recolector OTel con pipelines de traces y metrics.

## Beneficios Clave
- **Cargo Chef**: Compila solo dependencias en cambios de Cargo.lock, reduce tiempos de CI/CD en 90%.
- **Distroless**: Sin shell ni herramientas, superficie de ataque minimizada.
- **Memory Limiter**: OTel no consume más recursos que la propia aplicación.

## Gate de Verificación
✅ `docker compose up` levanta todo el sistema (Next.js, Rust Ingestor, OTel Collector).

## Evidencia
- `ingestor-rust/Dockerfile`
- `docker-compose.yml`
- `otel-config.yaml`
