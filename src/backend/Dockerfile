FROM denoland/deno:2.3.3-alpine

# Install system dependencies for audio splitting and PDF stamping
RUN apk add --no-cache ffmpeg curl

# Install pdfcpu (amd64 — Cloud Run default architecture)
RUN curl -fsSL "https://github.com/pdfcpu/pdfcpu/releases/download/v0.9.1/pdfcpu_0.9.1_Linux_amd64.tar.gz" \
    | tar -xz -C /usr/local/bin pdfcpu && \
    chmod +x /usr/local/bin/pdfcpu

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
