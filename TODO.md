# AnkiLM — TODO

> Legend: 🤖 = Claude does this | 👤 = You do this manually | 🌍 = `terraform apply`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the target architecture and
[docs/DECISIONS.md](docs/DECISIONS.md) for all ADRs.

---

## Phase 1 — Security & Git Hygiene ✅
- [x] `src/backend/.env` is in `.gitignore` and was never committed
- [x] `src/backend/.env.example` updated with all variables

---

## Phase 2 — File Naming Convention ✅
- [x] 🤖 `orchestrator.ts` extracts `lectureName` from folder basename (strips date prefix)
- [x] 🤖 `orchestrationHelper.ts` passes `lectureName` to Dify as workflow input
- [x] 🤖 Dify YAML: `lectureName` added to Start node; all 6 Save-* params use `<fach>_<lectureName>_` prefix
- [x] 🤖 `scripts/rename-existing-outputs.sh` for migrating existing files

---

## Phase 3 — Clean Up Wrong Infra (~1h)
- [x] 🤖 Remove the `file_acceptor` Cloud Run service from `infra/gcp/main.tf` — keep GCS, SA, and Artifact Registry (needed for backend API in Phase 5)
- [x] 🤖 Delete `infra/hetzner/` (Dify on RPi instead, no Terraform needed)
- [x] 🤖 Delete `src/file-acceptor/` (replaced by webhook endpoint on backend API)
- [x] 🤖 Delete `.github/workflows/deploy-file-acceptor.yml`
- [x] 🤖 Delete `docker-compose.local.yaml` (will be replaced in Phase 5)

---

## Phase 4 — GCS Wiring in Orchestrator (~2h)
Replace local file serving with GCS. Orchestrator uploads input files to GCS;
Dify fetches them via signed URL. No more `fileAcceptor.ts` or `FILE_SERVER_URL`.

- [ ] 🤖 Add `@google-cloud/storage` to `src/backend/deno.json`
- [ ] 🤖 New `src/backend/src/util/storage.ts`: `uploadToGcs(localPath)` → returns signed URL
- [ ] 🤖 Update `orchestrationHelper.ts`: replace `toFileServerPath` + `DIFY_FILE_SERVER_URL` with GCS signed URLs
- [ ] 🤖 Update `orchestrationHelper.ts`: remove `checkHealth()` (no local file server to check)
- [ ] 🤖 Delete `src/backend/src/fileAcceptor.ts`
- [ ] 🤖 Delete `src/backend/src/util/storageRoot.ts` `toFileServerPath()` (no longer needed)
- [ ] 🌍 `cd infra/gcp && terraform apply` — creates GCS bucket + service account
- [ ] 👤 Copy SA key from Terraform output → `src/backend/.env` as `GOOGLE_APPLICATION_CREDENTIALS`

---

## Phase 5 — Backend API Service (Cloud Run) (~4h)
The orchestrator becomes a proper HTTP API service that Dify calls back via webhook.
Replaces `src/backend/src/orchestrator.ts` as a standalone script.

- [ ] 🤖 New `src/backend/src/api/server.ts` (Hono or Oak):
  - `POST /api/upload` — accept MP3 + PDF, store to GCS, queue Dify job
  - `POST /api/webhook/dify` — receive Dify output, save files to GCS, update job status
  - `GET  /api/jobs/:id` — return job status + output file URLs
  - `GET  /health` — health check
- [ ] 🤖 Job queue: use in-memory queue for now (Redis/Cloud Tasks later)
- [ ] 🤖 Update `src/backend/Dockerfile` for the API server
- [ ] 🤖 Add Cloud Run service back to `infra/gcp/main.tf` (for the API, not file-acceptor)
- [ ] 🤖 Add Artifact Registry back to `infra/gcp/main.tf`
- [ ] 🤖 GitHub Action: `.github/workflows/deploy-backend.yml` (build → push → deploy Cloud Run)
- [ ] 🤖 Update Dify YAML: change `FILE_ACCEPTOR_URL` default to `https://api.ankilm.com/api/webhook/dify`

---

## Phase 6 — Dify on Raspberry Pi (~2h)
- [ ] 👤 Install Docker on RPi: `curl -fsSL https://get.docker.com | sh`
- [ ] 👤 Create `~/dify/docker-compose.yaml` on RPi (copy from official Dify repo, pin version)
- [ ] 👤 Set up Cloudflare Tunnel:
  - Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create tunnel
  - Install `cloudflared` on RPi: `curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg`
  - Add tunnel route: `dify.yourdomain.com` → `http://localhost:80`
  - Run `cloudflared tunnel run <token>` (or add as systemd service)
- [ ] 👤 Configure Dify: open `https://dify.yourdomain.com`, complete setup wizard
- [ ] 👤 Add OpenAI API key in Dify → Settings → Model Providers
- [ ] 👤 Recreate 4 knowledge bases (PRPD, VSYS, EAI, Artemis), upload all source documents
- [ ] 👤 Note the 4 new dataset IDs from Dify URL → share with Claude
- [ ] 🤖 Update `Dify-Summarize.yml` with new dataset IDs (after you provide them)
- [ ] 👤 Import updated `Dify-Summarize.yml` via Dify Studio → DSL Import
- [ ] 👤 Set environment variables in Dify: `FILE_ACCEPTOR_URL`, `FILE_ACCEPTOR_SECRET`

---

## Phase 7 — Frontend → Cloudflare Pages (~1h)
- [ ] 🤖 Change `vite.config.ts` base from `/anki-lm/` to `/`
- [ ] 🤖 Add `vercel.json` → actually `_redirects` file for Cloudflare Pages SPA routing
- [ ] 🤖 Remove GitHub Pages deploy action if present
- [ ] 👤 Cloudflare dashboard → Pages → Create project → Connect GitHub repo
  - Build command: `npm run build`
  - Output directory: `dist`
  - Root directory: `/` (repo root)
- [ ] 👤 Set environment variables in Cloudflare Pages: `VITE_API_URL=https://api.ankilm.com`
- [ ] 👤 Set custom domain in Cloudflare Pages settings

---

## Phase 8 — Auth + Database (Supabase) (~3h)
- [ ] 👤 Create Supabase project at supabase.com
- [ ] 👤 Note: project URL, anon key, service role key
- [ ] 🤖 Write Supabase migrations: `users`, `jobs`, `subscriptions` tables
- [ ] 🤖 Add Supabase auth to frontend (login/signup UI)
- [ ] 🤖 Add JWT verification middleware to backend API
- [ ] 🤖 Set Supabase env vars in Cloud Run + Cloudflare Pages

---

## Phase 9 — Stripe Payments (~3h)
- [ ] 👤 Create Stripe account, note API keys
- [ ] 👤 Create products + pricing in Stripe dashboard
- [ ] 🤖 Add `POST /api/stripe/webhook` to backend API
- [ ] 🤖 Add checkout flow to frontend
- [ ] 🤖 Gate `POST /api/upload` behind active subscription check
- [ ] 👤 Set Stripe webhook endpoint in Stripe dashboard → `https://api.ankilm.com/api/stripe/webhook`

---

## Phase 10 — Polish & Monitoring (~ongoing)
- [ ] 🤖 Frontend: live job status (SSE or polling)
- [ ] 🤖 Frontend: output viewer (list + render generated markdown files)
- [ ] 🤖 Add Cloud Logging + Error Reporting to backend API
- [ ] 🤖 GCS lifecycle policy: auto-delete raw MP3/PDF after 30 days
- [ ] 🤖 Rate limiting on `/api/upload`

---

## What I need from you before each phase

| Phase | What you need to provide |
|---|---|
| 4 | GCP project already exists (`anki-lm`) — just run `terraform apply` after Phase 3 cleanup |
| 5 | SA key from Terraform output (for local `.env`) |
| 6 | Your Cloudflare domain, new Dify dataset IDs after KB rebuild |
| 7 | Nothing — pure code + 3 Cloudflare dashboard clicks |
| 8 | Supabase project URL + keys |
| 9 | Stripe API keys |
