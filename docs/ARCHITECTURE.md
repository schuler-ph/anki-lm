# AnkiLM — Target Architecture

AnkiLM is an automated study assistant that turns university lecture recordings and
slide PDFs into summaries, flashcards, concept tables, and Anki-ready CSV exports.
It is designed as a single-tenant personal tool today, with a clear path to a
multi-tenant SaaS with Stripe billing.

---

## Components

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

```
1. User uploads MP3 + PDF via frontend
2. Backend API:
     a. Store raw files in GCS /input/
     b. Transcribe MP3 → text via OpenAI Whisper
     c. Stamp PDF with page numbers (pdfcpu)
     d. Store prepared files in GCS /input/<jobId>/for_dify/
     e. Call Dify workflow API with GCS signed URLs
3. Dify processes the files (AI pipeline, ~2–5 min)
4. Dify POSTs all output files to /api/webhook/dify
5. Backend saves outputs to GCS /output/<fach>/<lectureName>/
6. Frontend polls /api/jobs/:id, shows outputs when ready
```

---

## Environments

| Environment | Frontend | Backend API | Dify | Storage |
|---|---|---|---|---|
| **Production** | Cloudflare Pages | Cloud Run (auto-scale) | RPi / Hetzner | GCS |
| **Local dev** | `npm run dev` | `deno run src/api/server.ts` | existing local Dify | GCS (same bucket) |

---

## SaaS Readiness Path

The current single-tenant design becomes multi-tenant by:

1. **Auth** (Supabase) — already in the plan; each request is scoped to a user
2. **Tenant isolation** — GCS paths prefixed with `userId/`, Supabase RLS policies
3. **Billing** (Stripe) — gate `/api/upload` behind active subscription; count tokens/minutes used
4. **Dify scaling** — move from RPi to Hetzner or a hosted Dify instance; or migrate AI pipeline to pure code (LangChain / Vercel AI SDK) for full Cloud Run deployment
5. **Queue** — replace in-process job handling with Cloud Tasks for reliable at-least-once processing
