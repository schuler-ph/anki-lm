FROM denoland/deno:2.3.3-alpine

# Install system dependencies for audio splitting and PDF stamping
RUN apk add --no-cache ffmpeg curl

# Install pdfcpu
RUN curl -fsSL "https://github.com/pdfcpu/pdfcpu/releases/download/v0.9.1/pdfcpu_0.9.1_Linux_arm64.tar.gz" \
    | tar -xz -C /usr/local/bin pdfcpu && \
    chmod +x /usr/local/bin/pdfcpu

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock ./
RUN deno install

# Copy source
COPY src/ ./src/

RUN deno cache src/orchestrator.ts

# LECTURE_ROOT is mounted as a volume at runtime
ENV LECTURE_ROOT=/data/lectures

CMD ["deno", "run", \
  "--allow-net", \
  "--allow-env", \
  "--allow-read", \
  "--allow-write", \
  "--allow-run", \
  "src/orchestrator.ts"]
