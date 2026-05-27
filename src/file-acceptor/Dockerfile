FROM denoland/deno:2.3.3-alpine

WORKDIR /app

# Cache dependencies
COPY deno.json* ./
RUN deno install --allow-scripts || true

COPY main.ts .

# Cloud Run sets PORT env var automatically
ENV PORT=8080

EXPOSE 8080

RUN deno cache main.ts

CMD ["deno", "run", \
  "--allow-net", \
  "--allow-env", \
  "--allow-sys", \
  "main.ts"]
