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

- [x] 🤖 Add `@google-cloud/storage` to `src/backend/deno.json`
- [x] 🤖 New `src/backend/src/util/storage.ts`: `uploadToGcs(localPath)` → returns signed URL
- [x] 🤖 Update `orchestrationHelper.ts`: replace `toFileServerPath` + `DIFY_FILE_SERVER_URL` with GCS signed URLs
- [x] 🤖 Update `orchestrationHelper.ts`: remove `checkHealth()` (no local file server to check)
- [x] 🤖 Delete `src/backend/src/fileAcceptor.ts`
- [x] 🤖 Delete `src/backend/src/util/storageRoot.ts` `toFileServerPath()` (no longer needed)
- [x] 🌍 `cd infra/gcp && terraform apply` — creates GCS bucket + service account
- [x] 👤 Copy SA key from Terraform output → `src/backend/.env` as `GOOGLE_APPLICATION_CREDENTIALS`

---

## Phase 5 — Backend API Service (Cloud Run) (~4h)
The orchestrator becomes a proper HTTP API service that Dify calls back via webhook.
Replaces `src/backend/src/orchestrator.ts` as a standalone script.

- [x] 🤖 New `src/backend/src/api/server.ts` (Hono or Oak):
  - `POST /api/upload` — accept MP3 + PDF, store to GCS, queue Dify job
  - `POST /api/webhook/dify` — receive Dify output, save files to GCS, update job status
  - `GET  /api/jobs/:id` — return job status + output file URLs
  - `GET  /health` — health check
- [x] 🤖 Job queue: use in-memory queue for now (Redis/Cloud Tasks later)
- [x] 🤖 Update `src/backend/Dockerfile` for the API server
- [x] 🤖 Add Cloud Run service back to `infra/gcp/main.tf` (for the API, not file-acceptor)
- [x] 🤖 Add Artifact Registry back to `infra/gcp/main.tf`
- [x] 🤖 GitHub Action: `.github/workflows/deploy-backend.yml` (build → push → deploy Cloud Run)
- [x] 🤖 Update Dify YAML: change `FILE_ACCEPTOR_URL` default to `https://api.ankilm.com/api/webhook/dify`

---

## Phase 6 — Dify on Raspberry Pi (~2h)
- [x] 👤 Install Docker on RPi: `curl -fsSL https://get.docker.com | sh`
- [x] 👤 Create `~/dify/docker-compose.yaml` on RPi (copy from official Dify repo, pin version)
- [x] 👤 Set up Cloudflare Tunnel:
  - Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create tunnel
  - Install `cloudflared` on RPi: `curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg`
  - Add tunnel route: `dify.yourdomain.com` → `http://localhost:80`
  - Run `cloudflared tunnel run <token>` (or add as systemd service)
- [x] 👤 Configure Dify: open `https://dify.yourdomain.com`, complete setup wizard
- [x] 👤 Add OpenAI API key in Dify → Settings → Model Providers
- [x] 👤 Recreate 4 knowledge bases (PRPD, VSYS, EAI, Artemis), upload all source documents
- [x] 👤 Note the 4 new dataset IDs from Dify URL → share with Claude
- [x] 🤖 Update `Dify-Summarize.yml` with new dataset IDs (after you provide them)
- [x] 👤 Import updated `Dify-Summarize.yml` via Dify Studio → DSL Import
- [x] 👤 Set environment variables in Dify: `FILE_ACCEPTOR_URL`, `FILE_ACCEPTOR_SECRET`

---

## Phase 6.5 — API v2: Zwei-Schritt-Flow & Frontend-Wiring (~5h)
Der aktuelle `POST /api/upload` startet sofort die Pipeline.
Die UI erwartet aber: erst Dateien hochladen (Status `preparing`),
dann manuell den "AI-Pipeline starten"-Button klicken.
Außerdem muss die Demo-Seite von hardcodierten MDX-Daten auf echte API-Calls umgestellt werden.

### Backend (~2h)
- [x] 🤖 `POST /api/jobs` — MP3 + PDF nach GCS hochladen, Job mit Status `preparing` anlegen, Job-ID zurückgeben
- [x] 🤖 `POST /api/jobs/:id/start` — Transkription + Dify-Pipeline triggern (der "AI-Pipeline starten"-Button)
- [x] 🤖 `GET /api/jobs` — alle Jobs auflisten (für Frontend: Topics/Lectures laden)
- [x] 🤖 Job-Status `processing` zwischen `preparing` und `processed` hinzufügen
- [x] 🤖 Alten `POST /api/upload` (Upload+Start in einem) entfernen oder auf v2 umleiten

### Frontend (~3h)
- [x] 🤖 Hardcodierte Demo-Daten (`content[]` in `Demo/index.tsx`) durch echte `GET /api/jobs` Calls ersetzen
- [x] 🤖 "+ Audio" / "+ PDF" Buttons → `POST /api/jobs` (Dateien hochladen, Job anlegen)
- [x] 🤖 "AI-Pipeline starten" Button → `POST /api/jobs/:id/start`
- [x] 🤖 Status-Polling auf Job-Cards (`GET /api/jobs/:id` bis `processed`)
- [x] 🤖 Ergebnis-Dateien aus GCS Signed URLs laden (statt MDX-Imports)
- [x] 🤖 `VITE_API_URL` als Env-Variable einbinden (kein hardcodierter API-URL)

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

## Phase 8 — Auth (Firebase) (~3h)
Firestore is already wired for job persistence (Phase 6.5+). Phase 8 adds user login.

- [ ] 👤 Enable Firebase Authentication in GCP console → Firebase → Authentication → Sign-in methods → Google
- [ ] 👤 Note Firebase Web API key (Project Settings → General → Web API key)
- [ ] 🤖 Add Firebase Auth to frontend (Google sign-in button, auth state in React context)
- [ ] 🤖 Add JWT verification middleware to backend API (verify Firebase ID token on all `/api/*` routes)
- [ ] 🤖 Scope GCS paths + Firestore documents by `userId` prefix
- [ ] 🤖 Set `VITE_FIREBASE_API_KEY` in Cloudflare Pages env vars

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
- [ ] 🤖 Add Cloud Logging + Error Reporting to backend API
- [ ] 🤖 GCS lifecycle policy: auto-delete raw MP3/PDF after 30 days
- [ ] 🤖 Rate limiting auf `/api/jobs`

---

## What I need from you before each phase

| Phase | What you need to provide |
|---|---|
| 4 | GCP project already exists (`anki-lm`) — just run `terraform apply` after Phase 3 cleanup |
| 5 | SA key from Terraform output (for local `.env`) |
| 6 | Your Cloudflare domain, new Dify dataset IDs after KB rebuild |
| 6.5 | Nothing — pure code |
| 7 | Nothing — pure code + 3 Cloudflare dashboard clicks |
| 8 | Enable Firebase Auth in GCP console, note Web API key |
| 9 | Stripe API keys |
