#!/usr/bin/env bash
# Deploy or update Dify on the Hetzner VPS.
# Run from your local machine: bash infra/hetzner/deploy.sh <server-ip>
#
# Prerequisites:
#   - terraform apply already run (VPS exists)
#   - SSH access as root to the server
#   - .env.dify file created from .env.dify.example

set -euo pipefail

SERVER_IP="${1:-}"
if [[ -z "$SERVER_IP" ]]; then
  echo "Usage: $0 <server-ip>" >&2
  echo "Tip: get the IP from: cd infra/hetzner && terraform output server_ip" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_DIR="/opt/ankilm"

echo "Deploying to root@${SERVER_IP}..."

# Copy compose files
ssh "root@${SERVER_IP}" "mkdir -p ${REMOTE_DIR}/caddy ${REMOTE_DIR}/ssrf_proxy"
scp "${SCRIPT_DIR}/docker-compose.dify.yaml" "root@${SERVER_IP}:${REMOTE_DIR}/docker-compose.yaml"
scp "${SCRIPT_DIR}/caddy/Caddyfile" "root@${SERVER_IP}:${REMOTE_DIR}/caddy/Caddyfile"

# Copy squid config if it exists
if [[ -f "${SCRIPT_DIR}/ssrf_proxy/squid.conf" ]]; then
  scp "${SCRIPT_DIR}/ssrf_proxy/squid.conf" "root@${SERVER_IP}:${REMOTE_DIR}/ssrf_proxy/squid.conf"
fi

# Copy .env.dify if it exists locally (skip if already on server)
if [[ -f "${SCRIPT_DIR}/.env.dify" ]]; then
  echo "Copying .env.dify..."
  scp "${SCRIPT_DIR}/.env.dify" "root@${SERVER_IP}:${REMOTE_DIR}/.env.dify"
else
  echo "Warning: ${SCRIPT_DIR}/.env.dify not found. Make sure it exists on the server at ${REMOTE_DIR}/.env.dify"
fi

# Pull images and restart
ssh "root@${SERVER_IP}" "
  cd ${REMOTE_DIR}
  docker compose pull
  docker compose up -d --remove-orphans
  docker compose ps
"

echo ""
echo "Deployment complete!"
echo "Dify should be available at: http://${SERVER_IP} (or your configured domain)"
echo ""
echo "Next steps if this is a first install:"
echo "  1. Open http://${SERVER_IP} and complete the Dify setup wizard"
echo "  2. Add your OpenAI API key under Settings → Model Providers"
echo "  3. Re-create your Knowledge Bases (PRPD, VSYS, EAI, Artemis)"
echo "  4. Note the new dataset IDs and report them to Claude to update Dify-Summarize.yml"
echo "  5. Import the updated workflow YAML via Dify Studio → DSL Import"
