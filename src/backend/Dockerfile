FROM denoland/deno:2.3.3

# Install system dependencies for audio splitting and PDF stamping
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install pdfcpu (amd64 — Cloud Run default architecture)
RUN curl -fsSL "https://github.com/pdfcpu/pdfcpu/releases/download/v0.12.1/pdfcpu_0.12.1_Linux_x86_64.tar.xz" \
    -o /tmp/pdfcpu.tar.xz && \
    tar -xJf /tmp/pdfcpu.tar.xz -C /tmp && \
    find /tmp -name pdfcpu -type f -exec mv {} /usr/local/bin/pdfcpu \; && \
    chmod +x /usr/local/bin/pdfcpu && \
    rm /tmp/pdfcpu.tar.xz

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock ./
RUN deno install

# Copy source
COPY src/ ./src/

RUN deno cache src/api/server.ts

ENV PORT=8080
EXPOSE 8080

CMD ["deno", "run", \
  "--allow-net", \
  "--allow-env", \
  "--allow-read", \
  "--allow-write", \
  "--allow-run", \
  "src/api/server.ts"]
