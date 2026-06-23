# Architecture Decision Records

Short records of every significant architectural choice made for AnkiLM.
Each ADR captures what was decided, why, and what was explicitly rejected.

---

## ADR-001 — GCP as primary cloud provider

**Decision:** Use Google Cloud Platform (Cloud Run, GCS, Artifact Registry) as the primary cloud infrastructure.

**Why:** Cloud Run is the best serverless container runtime for a Deno/Node backend that does CPU-heavy work (Whisper transcription, PDF stamping). It scales to zero between lectures (cost-efficient), handles concurrency automatically, and integrates tightly with GCS and Artifact Registry. AWS is equivalent in capability but adds no value here. Cloudflare Workers were considered but rejected — the 128 MB memory limit and no support for long-running tasks (Whisper takes 10–60 s per file) make them unsuitable for the processing pipeline.

---

## ADR-002 — Cloudflare Pages for the frontend

**Decision:** Host the React/Vite frontend on Cloudflare Pages.

**Why:** The domain is already registered at Cloudflare, so the setup is zero-click: connect the GitHub repo, set build command, done. Cloudflare Pages gives instant global CDN, automatic HTTPS, preview deployments per PR, and a generous free tier. Firebase Hosting and Vercel are equally capable, but require a second DNS provider or moving the domain. There is no reason to add that friction.

---

## ADR-003 — Raspberry Pi (with Cloudflare Tunnel) for Dify, Hetzner as upgrade path

**Decision:** Run Dify on the existing Raspberry Pi behind a Cloudflare Tunnel for personal use. Migrate to a Hetzner CX22 VPS (~€4/month) if reliability or performance becomes a concern.

**Why:** Dify is a multi-container stateful application (Postgres, Redis, Weaviate, multiple API workers). It cannot run on Cloud Run or Cloudflare Workers. A GCP Compute VM would cost ~€15–20/month for equivalent specs — five times the Hetzner price with no meaningful benefit for this workload. The RPi is already running and the Cloudflare Tunnel solves the public IP problem without opening firewall ports. The tunnel also provides free HTTPS termination, making a reverse proxy (Caddy, Nginx) unnecessary.

---

## ADR-004 — Firebase/Firestore for database; Firebase Auth for authentication

**Decision:** Use Google Cloud Firestore (native mode) for the job and application database, and Firebase Authentication for user auth.

**Why:** Firestore is a managed, serverless NoSQL database that integrates natively with GCP — same project, same IAM, same Terraform, same billing account as Cloud Run, GCS, and Artifact Registry. No additional cloud provider to manage. The `@google-cloud/firestore` npm package works in Deno via `preferRest: true` (avoids gRPC). Firestore transactions solve the concurrent-webhook race condition cleanly. Firebase Auth provides JWT-based OAuth (Google login) that works with both the React frontend and the Deno backend, and pairs with Firestore security rules for tenant isolation in Phase 8.

**Replaces:** Supabase (original ADR-004). Supabase was attractive for its combined auth+Postgres free tier, but adding a second cloud provider outside GCP creates unnecessary operational complexity (separate billing, separate credentials, cross-cloud latency). Firestore + Firebase Auth keeps the entire stack in one Google Cloud project.

---

## ADR-005 — No file-acceptor service; Dify calls back via webhook

**Decision:** Remove the `fileAcceptor.ts` HTTP file server entirely. Instead, Dify POSTs its output files to a webhook endpoint (`POST /api/webhook/dify`) on the backend API service, which writes them directly to GCS.

**Why:** The original file-acceptor was a Mac-local HTTP server that Dify used as a shared filesystem over HTTP. This is a local-dev shortcut, not a cloud pattern. In the target architecture Dify and the backend run on different hosts — a shared filesystem is impossible. The webhook pattern is the correct cloud-native equivalent: Dify finishes a step, POSTs the result to the backend, the backend persists it to GCS and updates job status. This also gives the backend a single place to trigger downstream actions (notifications, status updates) when outputs arrive.

---

## ADR-006 — Cloudflare domain stays at Cloudflare; used as DNS proxy for all services

**Decision:** Keep DNS at Cloudflare and use the Cloudflare proxy (orange cloud) for all public-facing hostnames, regardless of where the origin runs.

**Why:** Cloudflare's proxy provides free DDoS protection, HTTPS termination, and global anycast routing for any origin server — whether that origin is GCP Cloud Run, a Hetzner VPS, or a Raspberry Pi behind a tunnel. Moving the domain to another registrar or DNS provider would lose these benefits without gaining anything. `api.ankilm.com` → Cloud Run, `dify.ankilm.com` → RPi/Hetzner via tunnel, `ankilm.com` → Cloudflare Pages — all routes managed in one Cloudflare dashboard.

---

## ADR-007 — Personal-first; multi-tenant added later without rearchitecting

**Decision:** Build the initial version for a single authenticated user. Design the data model and storage paths so that multi-tenancy can be added by prefixing with `userId` without changing the core logic.

**Why:** Adding full multi-tenancy (Stripe billing, per-tenant quotas, tenant isolation, admin tooling) before the core product is validated is wasted effort. At the same time, a design that hard-codes assumptions about a single user (e.g., global GCS paths, no auth) would require a full rewrite to publish. The chosen approach — Supabase auth from day one, `userId`-scoped GCS paths, JWT middleware on all API routes — adds minimal overhead now and makes the SaaS launch a matter of enabling Stripe and removing a feature flag.

---

## ADR-008 — File naming convention: `<fach>_<lectureName>_<content>.<ext>`

**Decision:** All output files are named `<FACH>_<LectureName>_<content>.md`, e.g. `EAI_ArchitekturMuster_01-summary.md`.

**Why:** The previous convention used bare filenames like `01-summary.md`. When multiple lecture outputs are loaded into an AI chat context simultaneously, the model has no way to identify which file belongs to which subject or lecture. The new convention makes every file self-identifying without opening it. The `fach` prefix groups files by subject; the `lectureName` suffix (stripped of the `YYYY-MM-DD_` date prefix from folder names) provides the topic. The content suffix preserves sort order and type at a glance.

---

## ADR-009 — Supabase Auth instead of Firebase Auth

**Decision:** Use Supabase Auth (Google OAuth provider) for Phase 8 authentication. Firebase Auth was implemented and then removed.

**Why:** Firebase Auth requires the `/__/auth/handler` endpoint to be served from the same origin as the app. On Cloudflare Pages this means a Worker proxy that forwards all `/__/` paths to `anki-lm.firebaseapp.com`. After two days of debugging this proxy, the flow still failed in production (handler HTML loaded but its JS never ran, OAuth redirect URIs missing, ASSETS binding intercepting before the Worker). The root cause is that Firebase Auth is designed for Firebase Hosting — the proxy approach fights the platform.

Supabase Auth's OAuth flow is fully hosted on `<project>.supabase.co`, so the callback never touches our domain's static file server. The app only needs to call `supabase.auth.signInWithOAuth()` and handle the return redirect — no proxies, no `/__/` paths, no Worker needed. JWT verification on the backend uses the same `jose`+JWKS pattern (endpoint: `<project>.supabase.co/auth/v1/.well-known/jwks.json`), keeping the middleware interface identical.

Additionally, Supabase was already the planned Phase 8 technology per CLAUDE.md (Auth/DB: Supabase). The Firebase pivot was undocumented and contradicted the architecture plan.

**Rejected:** Firebase Auth — requires Firebase Hosting or a fragile same-origin proxy; incompatible with Cloudflare Pages static hosting.

---

## ADR-010 — Server-side streaming ZIP export of outputs

**Decision:** Add `GET /api/export?type=<type>&scope=<scope>` to the backend API. It collects the matching GCS objects across a user's lectures and streams them back as a single `application/zip` (via `jsr:@zip-js/zip-js`, `ZipWriter` over a `TransformStream`). The frontend exposes an "Export" dropdown in the topic header ("Alle Folien", "Alle Zusammenfassungen", "Alle Anki-Decks", … , "Alles"), scoped to the current `fach` or all topics.

**Why:** The recurring need is bundling many lectures' artefacts ("all slides", "all summaries", "all Anki decks") into one download. A backend streaming ZIP keeps peak Cloud Run memory bounded by the largest single file (not the whole archive), handles arbitrarily large PDF bundles, produces clean `FACH/LectureName/...` paths inside the archive (consistent with ADR-008), and reuses the existing `requireAuth` middleware + GCS helpers. GCS→Cloud-Run egress is free within `europe-west3`, so the only added cost is the Cloud-Run→browser egress that any download incurs anyway.

**Anki as CSV:** The `anki` output is converted to Anki-importable CSV instead of shipping the raw `.md`. The markdown groups cards under `## <NoteType>` section headers; rows are already semicolon-separated and end in a tags column. Because Anki cannot mix note types (differing field counts, differing tags-column index) in a single import file, **each note-type section becomes its own CSV** named `<base>_anki__<Section>.csv`, each with `#separator:Semicolon`, `#html:true`, and a per-section `#tags column:N` directive. `#notetype` is intentionally omitted so a locale/name mismatch never hard-fails the import — the user picks the note type once per file (Anki remembers the mapping).

**Slides:** "slides" bundles the raw uploaded PDFs (`pdfGcsPaths` + `pdfOriginalNames`) — always available regardless of pipeline status and with predictable names. The page-numbered (stamped) PDFs remain reachable via `GET /api/jobs/:id/intermediates`.

**Rejected:** Client-side ZIP (JSZip) — would download every file (incl. large PDFs) into the browser before zipping and reconstruct names from signed-URL paths; the backend approach is one clean click → one file with bounded server memory. Google-Drive one-way sync was considered alongside this (rclone-cron on the RPi vs. an in-app Drive-API push) but deferred — see TODO Phase 12.

---

## ADR-011 — (reserved) Google Drive one-way sync

**Status:** Deferred. Evaluated alongside ADR-010. Leading option for the single-tenant phase is an `rclone copy gcs:ankilm-files/output gdrive:AnkiLM/output` cron on the existing Raspberry Pi (zero cost, no new code, `copy` not `sync` so nothing is ever deleted on Drive). An in-app Drive-API push (OAuth `drive.file` scope, refresh token per user in Firestore, push on the Dify webhook) is the SaaS-ready alternative but carries OAuth/token/maintenance overhead. To be recorded here when implemented. See TODO Phase 12.
