# RLM Core Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv for fast package management
RUN pip install uv

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Install dependencies
RUN uv pip install --system -e .

# Expose port
EXPOSE 8082

# Run the server
CMD ["uvicorn", "rlm_core.main:app", "--host", "0.0.0.0", "--port", "8082"]
