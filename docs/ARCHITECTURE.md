# AnkiLM — Architecture

AnkiLM is an automated study assistant that turns university lecture recordings and
slide PDFs into summaries, flashcards, concept tables, and Anki-ready CSV exports.
It is designed as a single-tenant personal tool today, with a clear path to a
multi-tenant SaaS with Stripe billing.

---

## Current State (as of Phase 2)

| Component | Current Reality | Target (see diagram below) | Phase |
|---|---|---|---|
| Frontend | GitHub Pages (`schuler-ph.github.io/anki-lm/`) | Cloudflare Pages (`ankilm.com`) | 7 |
| Backend | Local Deno script (`src/backend/src/orchestrator.ts`) | Cloud Run HTTP API (`api.ankilm.com`) | 5 |
| File I/O | Local filesystem + `fileAcceptor.ts` HTTP server (port 8019) | GCS with signed URLs | 4 |
| Dify file transport | Dify reads/writes files via `fileAcceptor.ts` | Webhook `POST /api/webhook/dify` | 5 |
| Dify host | Local Docker / RPi (manual, not Terraform-managed) | RPi via Cloudflare Tunnel | 6 |
| Database | None | Supabase (Postgres + Auth) | 8 |
| Billing | None | Stripe | 9 |

`infra/hetzner/` contains a complete Hetzner VPS + Dify setup as an upgrade path (ADR-003), but it is not the active setup.

---

## Target Components

```
┌─────────────────────────────────────────────────────────────────┐
│ User                                                            │
│   browser → ankilm.com (Cloudflare Pages)                      │
│     upload MP3 + PDF                                           │
│     poll job status                                             │
│     view / download outputs                                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ GCP — Cloud Run: Backend API  (api.ankilm.com)                  │
│                                                                 │
│  POST /api/upload          receive files, store to GCS,        │
│                            call Dify workflow with signed URLs  │
│  POST /api/webhook/dify    receive Dify outputs, save to GCS,  │
│                            update job status                    │
│  GET  /api/jobs/:id        return status + output file URLs    │
│  POST /api/stripe/webhook  handle Stripe payment events        │
└──────────┬────────────────────────┬────────────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐    ┌───────────────────────────────────────┐
│ GCP — GCS Bucket │    │ Supabase                              │
│                  │    │   PostgreSQL: users, jobs,            │
│  /input/         │    │              subscriptions            │
│    *.mp3         │    │   Auth: JWT, OAuth                    │
│    *_numbered.pdf│    └───────────────────────────────────────┘
│  /output/        │
│    *_summary.md  │    ┌───────────────────────────────────────┐
│    *_anki.md     │    │ Stripe                                │
│    …             │    │   Products, subscriptions, webhooks   │
└──────────────────┘    └───────────────────────────────────────┘
           ▲
           │ signed URLs (input fetch)
           │ signed URLs (output save via webhook)
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Raspberry Pi — Dify  (dify.ankilm.com via Cloudflare Tunnel)   │
│                                                                 │
│  Workflow: Dify-Summarize                                       │
│    1. Iterate input files (extract text from PDF/TXT)          │
│    2. LM Summarize  → summary.md                               │
│    3. LM Veredeln   → refined transcript                       │
│    4. LM TLDR       → one-pager                                │
│    5. LM RAG Keywords → query knowledge bases                  │
│    6. LM Konzepte / Beispiele / ANKI → structured outputs     │
│    7. POST all outputs → api.ankilm.com/api/webhook/dify       │
│                                                                 │
│  Knowledge Bases (Weaviate RAG):                               │
│    PRPD · VSYS · EAI · Artemis                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow — Processing a Lecture

### Current flow (Phase 1–2)
```
1. User runs: deno task dev (orchestrator.ts watches lecture folders)
2. Orchestrator:
     a. Transcribe MP3 → text via OpenAI Whisper
     b. Stamp PDF with page numbers (pdfcpu)
     c. Save prepared files to {lecturePath}/for_dify/
     d. Call Dify workflow API with file paths
3. Dify processes the files (AI pipeline, ~2–5 min)
4. Dify saves output files via fileAcceptor.ts → {lecturePath}/from_dify/
   File naming: <FACH>_<LectureName>_<content>.md
   e.g. EAI_ArchitekturMuster_01-summary.md
```

### Target flow (Phase 5+)
```
1. User uploads MP3 + PDF via frontend
2. Backend API:
     a. Store raw files in GCS /input/
     b. Transcribe MP3 → text via OpenAI Whisper
     c. Stamp PDF with page numbers (pdfcpu)
     d. Store prepared files in GCS /input/<jobId>/for_dify/
     e. Call Dify workflow API with GCS signed URLs
3. Dify processes the files (AI pipeline, ~2–5 min)
4. Dify POSTs all output files to POST /api/webhook/dify
5. Backend saves outputs to GCS /output/<fach>/<lectureName>/
6. Frontend polls /api/jobs/:id, shows outputs when ready
```

### Backend modules (`src/backend/src/`)
- `orchestrator.ts` — watches lecture folders, drives the pipeline
- `util/openai.ts` — Whisper transcription (MP3 → text)
- `util/pdf.ts` — PDF page stamping via pdfcpu
- `util/mp3.ts` — audio splitting
- `util/orchestrationHelper.ts` — calls Dify workflow API, constructs inputs incl. `lectureName`
- `util/storageRoot.ts` / `util/input.ts` / `util/output.ts` — local file path helpers (to be replaced by GCS in Phase 4)
- `fileAcceptor.ts` — local HTTP server (port 8019) Dify uses to save outputs (**deleted in Phase 3**)
- `transcribe.ts` — transcription orchestration

---

## Environments

| Environment | Frontend | Backend | Dify | Storage |
|---|---|---|---|---|
| **Production** | Cloudflare Pages | Cloud Run (auto-scale) | RPi / Hetzner | GCS |
| **Local dev** | `npm run dev` | `deno task dev` (orchestrator.ts) | local Docker Dify | local filesystem |

---

## SaaS Readiness Path

The current single-tenant design becomes multi-tenant by:

1. **Auth** (Supabase) — already in the plan; each request is scoped to a user
2. **Tenant isolation** — GCS paths prefixed with `userId/`, Supabase RLS policies
3. **Billing** (Stripe) — gate `/api/upload` behind active subscription; count tokens/minutes used
4. **Dify scaling** — move from RPi to Hetzner or a hosted Dify instance; or migrate AI pipeline to pure code (LangChain / Vercel AI SDK) for full Cloud Run deployment
5. **Queue** — replace in-process job handling with Cloud Tasks for reliable at-least-once processing
