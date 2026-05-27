# AnkiLM — Migration TODO

> Legend: 🤖 = I (Claude) do this autonomously | 👤 = You must do this manually | 🌍 = Terraform handles it (you run `terraform apply`)

---

## Autonomy Summary

| Category | What you must do manually |
|---|---|
| **Dify** | Re-upload knowledge base documents after VPS migration; import updated workflow YAML; set OpenAI API key + env vars on new instance |
| **Google Cloud** | Create GCP project + link billing account; run `terraform apply`; add service account key as GitHub Secret |
| **Hetzner** | Create account + add payment; run `terraform apply` (or provision VPS manually); add SSH key |
| **Security** | Rotate OpenAI + Notion API keys in their dashboards; run `git filter-repo` |
| **Vercel** | Create account; link GitHub repo; set env vars |

Everything else — all code changes, Dockerfiles, CI/CD, Terraform configs, Dify YAML updates — I generate and commit locally.

---

## Phase 1 — Security & Git Hygiene (~1h)

> **Critical**: Real API keys are committed to git history in `src/backend/.env`.

- [x] 🤖 Add `src/backend/.env` to `.gitignore`
- [x] 🤖 Create `src/backend/.env.example` with placeholder values
- [ ] 👤 Rotate **OpenAI API key** at platform.openai.com → Settings → API Keys
- [ ] 👤 Rotate **Notion API key** at notion.so → Settings → My Connections
- [ ] 👤 Purge `.env` from git history:
  ```bash
  # Install: brew install git-filter-repo
  git filter-repo --path src/backend/.env --invert-paths --force
  git push --force
  ```

---

## Phase 2 — File Naming Convention (~2h)

Goal: Output files get names like `EAI_ArchitekturMuster_summary.md` so AI chat context is unambiguous.

The `fach` variable is already passed into the Dify workflow. The lecture folder name (e.g. `2025-05-20_ArchitekturMuster`) is passed as `output_path`. We just need to extract a clean name and prefix files.

- [ ] 🤖 Add `lectureName` input to Dify workflow Start node (extracted from folder name without date prefix)
- [ ] 🤖 Update all 6 "Save X" HTTP-Request nodes in Dify YAML to use `{{fach}}_{{lectureName}}_01-summary.md` etc.
- [ ] 🤖 Update orchestrator: pass `lectureName` extracted from folder basename (strip `YYYY-MM-DD_` prefix)
- [ ] 🤖 Update `sendDifyRequest()` to pass `lectureName` in inputs
- [ ] 🤖 Write migration script `scripts/rename-existing-outputs.sh` for existing files

---

## Phase 3 — Replace fileAcceptor.ts with Cloud Run + GCS (~3–4h)

**Current**: Dify POSTs files to `http://host.docker.internal:8019` (Mac-local).  
**New**: A tiny Cloud Run service accepts POST (writes to GCS) and GET (reads from GCS). Same HTTP API — no Dify workflow logic changes, only the URL changes.

### 3a. Google Cloud Infrastructure (Terraform)
- [ ] 👤 Create GCP project at console.cloud.google.com (note the `PROJECT_ID`)
- [ ] 👤 Enable billing on the project
- [ ] 🤖 Write `infra/gcp/main.tf`:
  - `google_storage_bucket` — `ankilm-files` bucket (private, versioning off)
  - `google_service_account` — `ankilm-backend` SA
  - `google_storage_bucket_iam_member` — SA gets `roles/storage.objectAdmin`
  - `google_cloud_run_v2_service` — deploys file-acceptor container
  - `google_service_account_key` output (for backend .env + Dify auth header)
- [ ] 🌍 `cd infra/gcp && terraform init && terraform apply` (you run this)

### 3b. Cloud Run file-acceptor service
- [ ] 🤖 Write `src/backend/src/fileAcceptorGCS.ts` (Deno/Oak):
  - `POST /?fileName=<path>` → upload body text to GCS object at `<path>`
  - `GET /<path>` → stream GCS object to response
  - Auth: Bearer token check (env var `FILE_ACCEPTOR_SECRET`)
- [ ] 🤖 Write `src/backend/Dockerfile.file-acceptor`
- [ ] 🤖 Write GitHub Action `.github/workflows/deploy-file-acceptor.yml` (build → push to Artifact Registry → deploy Cloud Run)

### 3c. Update Dify workflow YAML
- [ ] 🤖 In `src/backend/workflow/Dify-Summarize.yml`: replace all 6 instances of `http://host.docker.internal:8019` with `{{env.FILE_ACCEPTOR_URL}}`
- [ ] 🤖 Add `FILE_ACCEPTOR_URL` and `FILE_ACCEPTOR_SECRET` as Dify environment variables in the YAML
- [ ] 👤 Import updated workflow YAML into Dify UI (DSL Import button) or via Dify API:
  ```bash
  # After you have DIFY_ADMIN_TOKEN:
  curl -X POST http://<dify-host>/console/api/apps/<app-id>/workflows/draft/import \
    -H "Authorization: Bearer $DIFY_ADMIN_TOKEN" \
    -F "data=@src/backend/workflow/Dify-Summarize.yml"
  ```
- [ ] 👤 Set `FILE_ACCEPTOR_URL` and `FILE_ACCEPTOR_SECRET` in Dify → Settings → Environment Variables

### 3d. Update backend orchestrator
- [ ] 🤖 Update `orchestrationHelper.ts`: replace `FILE_SERVER_URL` health check with Cloud Run URL
- [ ] 🤖 Update `orchestrationHelper.ts`: upload processed files directly to GCS (using `@google-cloud/storage` or signed URLs) instead of via fileAcceptor POST
- [ ] 🤖 Update `sendDifyRequest()`: pass `DIFY_FILE_SERVER_URL` pointing to Cloud Run base URL

---

## Phase 4 — Frontend Hosting → Vercel (~2h)

**Current**: GitHub Pages (static, no env vars, no backend proxy).  
**New**: Vercel (env vars, rewrite rules for API proxy, auto-deploys).

- [ ] 🤖 Change `vite.config.ts` `base` from `/anki-lm/` to `/`
- [ ] 🤖 Create `vercel.json` with rewrite rules: `/api/*` → backend URL
- [ ] 🤖 Update `package.json` build script if needed
- [ ] 👤 Create Vercel account at vercel.com, import GitHub repo `schuler-ph/dir-praxis`
- [ ] 👤 Set env vars in Vercel dashboard: `VITE_BACKEND_URL`, etc.
- [ ] 🤖 Delete `.github/workflows/deploy-github-pages.yml` if it exists, create `.github/workflows/deploy-vercel.yml`

---

## Phase 5 — Dockerize Frontend & Backend (~2h)

- [ ] 🤖 Write `src/frontend/Dockerfile` (multi-stage: `node:22-alpine` build → `nginx:alpine` serve)
- [ ] 🤖 Write `src/backend/Dockerfile.orchestrator` (`denoland/deno:alpine`, includes `ffmpeg` + `pdfcpu` installs)
- [ ] 🤖 Write `docker-compose.local.yaml` at repo root (orchestrator + file-acceptor-gcs, mounts local LECTURE_ROOT)
- [ ] 🤖 Write `.dockerignore` files

---

## Phase 6 — Dify Migration to Hetzner VPS (~4–6h)

**Why Hetzner over RPi**: 4€/month, reliable uptime, static IP, no power/network dependency.

### 6a. Provision VPS with Terraform
- [ ] 🤖 Write `infra/hetzner/main.tf`:
  - `hcloud_server` — CX22 (4GB RAM, 2vCPU, 40GB SSD) ARM64
  - `hcloud_ssh_key` — your public key
  - `hcloud_firewall` — allow 22, 80, 443, 5001 (Dify API)
  - `hcloud_volume` — 20GB persistent volume for Dify DB + files
- [ ] 👤 Create Hetzner account at hetzner.com/cloud, get API token
- [ ] 👤 Add Hetzner token to `infra/hetzner/terraform.tfvars`
- [ ] 🌍 `cd infra/hetzner && terraform init && terraform apply` (you run this)

### 6b. Prepare production docker-compose for Dify
- [ ] 🤖 Adapt `docker-compose.yaml` → `infra/hetzner/docker-compose.dify.yaml`:
  - Remove `build:` directives, use official image tags
  - Add Caddy reverse proxy service (auto-HTTPS)
  - Mount persistent volume for postgres data + weaviate
  - Add `restart: unless-stopped` to all services
- [ ] 🤖 Write `infra/hetzner/caddy/Caddyfile` (HTTPS termination for Dify domain)
- [ ] 🤖 Write `infra/hetzner/deploy.sh` (rsync compose file, `docker compose pull && up -d`)

### 6c. Knowledge Base migration — MANUAL, no automation possible
> The RAG knowledge bases live inside Dify's internal Weaviate + Postgres. There is no export API.

- [ ] 👤 SSH into new Hetzner VPS, bring up Dify docker-compose
- [ ] 👤 Open Dify UI, go to Knowledge → recreate each of the 4 knowledge bases:
  - **PRPD** (was dataset_id: `DfHClPXl6V...`)
  - **VSYS** (was dataset_id: `4hSxhf+7/2...`)
  - **Artemis** (was dataset_id: `CBSKaUAzt0...`)
  - **EAI** (was dataset_id: `L5tL838/m9...`)
- [ ] 👤 Upload all source documents to each knowledge base
- [ ] 👤 Note down the 4 new dataset_ids from the Dify URL (`/datasets/<id>/documents`)
- [ ] 👤 Share new dataset IDs → I update `Dify-Summarize.yml` with correct IDs
- [ ] 🤖 Update `Dify-Summarize.yml` with new dataset_ids after you provide them
- [ ] 👤 Import updated YAML into new Dify instance
- [ ] 👤 Set all environment variables in new Dify (OpenAI key, lang, all prompts — already in YAML env section)

---

## Phase 7 — Full-Stack Integration (~2h)

- [ ] 🤖 Update `src/backend/.env.example` with all new variables (`GCS_BUCKET`, `FILE_ACCEPTOR_URL`, `DIFY_API_URL` pointing to Hetzner, etc.)
- [ ] 🤖 Update `README.md` with new architecture diagram + setup instructions
- [ ] 👤 Set all env vars in GitHub Secrets for Actions
- [ ] 👤 End-to-end test: drop MP3 + PDF into local folder, run orchestrator, verify outputs appear in GCS bucket + Dify produces files

---

## Phase 8 — Usability & Extras (ongoing)

- [ ] 🤖 Frontend: file upload UI (drag-and-drop MP3/PDF → triggers orchestrator via API)
- [ ] 🤖 Frontend: live pipeline status (SSE stream from orchestrator)
- [ ] 🤖 Frontend: output browser (list GCS bucket contents, view generated markdown files inline)
- [ ] 🤖 Add Grafana + Loki to Hetzner compose stack for log monitoring
- [ ] 🤖 GitHub Action: auto-update Dify workflow on YAML changes (calls Dify import API)
- [ ] 🤖 Add `scripts/migrate-knowledge-base.sh` — documents the Dify KB setup steps for repeatability

---

## Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Frontend hosting | **Vercel** | Free tier, env vars, API rewrites; GitHub Pages can't do any of this |
| Reverse proxy | **Caddy** | Auto-HTTPS, dead-simple config, Docker-native; Envoy is service-mesh overkill |
| File storage | **GCS** | Free first 5GB/month, Terraform support, signed URLs for Dify input |
| File acceptor replacement | **Cloud Run micro-service** | Same HTTP API as current fileAcceptor.ts, no Dify workflow logic changes |
| Dify hosting | **Hetzner CX22** | 4€/month, ARM64, reliable; RPi has power/SD card/home-network reliability issues |
| VPS provisioning | **Terraform + hcloud provider** | Reproducible, version-controlled; avoids manual Hetzner console clicks |

---

## What I Need From You Before Starting

1. **GCP Project ID** (after you create it) — needed to fill Terraform variables
2. **Hetzner API token** — for `infra/hetzner/terraform.tfvars`
3. **Your SSH public key** — for Hetzner server access
4. **Dify app ID** — visible in the Dify URL when you open the Summarize workflow
5. **Preferred domain for Dify** (e.g. `dify.yourdomain.com`) or we use the raw Hetzner IP

I don't need any additional MCP server access — I can write all Terraform, Docker, and code changes locally. The Dify YAML can be updated by modifying the file and you import it via the Dify UI (or we script the API call).
