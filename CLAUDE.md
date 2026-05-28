# AnkiLM — Claude Context

Du bist ein Senior TypeScript/Deno und Google Cloud Engineer.
Wir bauen AnkiLM: ein Tool, das Universitäts-Vorlesungsaufnahmen (MP3) und Folien-PDFs
automatisch in Zusammenfassungen, Lernkarten und Anki-CSV-Exporte umwandelt.
Ziel: zunächst single-tenant für den persönlichen Gebrauch, dann SaaS mit Stripe-Billing.

## Kontext-Dateien (IMMER zuerst lesen)

Bevor du Code schreibst oder Architektur-Fragen beantwortest, lies diese Dateien:

1. `docs/ARCHITECTURE.md` — Aktueller Stand vs. Ziel-Architektur, Datenfluss, Backend-Module.
   Die **"Current State"-Tabelle oben** zeigt was bereits läuft vs. was noch gebaut werden muss.
2. `TODO.md` — Phasen 1–10. Hake erledigte Tasks ab (🤖 = Claude, 👤 = manuell, 🌍 = terraform).
   Single Source of Truth für den Fortschritt.
3. `docs/DECISIONS.md` — Architecture Decision Records (ADR-001 bis ADR-008).
   Dokumentiere jede nicht-triviale Entscheidung hier, bevor du Code schreibst.
4. `src/backend/.env.example` — Alle Umgebungsvariablen mit Erklärungen.

## Tech Stack

- **Backend**: Deno 2.x, TypeScript strict mode
- **Frontend**: React + Vite (aktuell GitHub Pages, Ziel: Cloudflare Pages)
- **AI Workflow**: Dify (self-hosted, DSL-YAML in `src/backend/workflow/Dify-Summarize.yml`)
- **Cloud**: GCP (Cloud Run, GCS, Artifact Registry) via Terraform (`infra/gcp/`)
- **Auth/DB**: Supabase (Phase 8, noch nicht aufgesetzt)
- **Payments**: Stripe (Phase 9, noch nicht aufgesetzt)
- **IaC**: Terraform — GCP in `infra/gcp/`, Hetzner-Fallback in `infra/hetzner/`

## Wichtige Begriffe

- **Fach** — Studiengang/Modul (z.B. `eai`, `lar`, `prpd`, `vsys`). Ist erster Teil des Dateinamens.
- **lectureName** — Vorlesungsname ohne Datumspräfix (z.B. `ArchitekturMuster` aus `2025-05-20_ArchitekturMuster`).
- **Dateiname-Konvention** — `<FACH>_<LectureName>_<content>.md`, z.B. `EAI_ArchitekturMuster_01-summary.md`
- **Orchestrator** — `src/backend/src/orchestrator.ts`: lokales Deno-Script, überwacht Vorlesungsordner.
- **fileAcceptor** — lokaler HTTP-Server (Port 8019), über den Dify Output-Dateien ablegt (**wird in Phase 3 gelöscht**).
- **for_dify/** — Unterordner mit vom Orchestrator aufbereiteten Eingabedateien (MP3→TXT, PDF gestempelt).
- **from_dify/** — Unterordner mit Dify-Output-Dateien (summary, veredelt, tldr, konzepte, beispiele, anki).
- **Dify-Summarize.yml** — Dify DSL-Export in `src/backend/workflow/`. Änderungen müssen manuell via Dify Studio → DSL Import eingespielt werden (kein Auto-Sync).

## Strikte Regeln

- **Deno, kein Node.** Kein `npm`, kein `node_modules`. Imports über JSR (`jsr:`) oder HTTP.
- **TypeScript strict.** Kein `any`. Keine manuellen Typ-Duplikate wo Inferenz möglich ist.
- **Kein direktes `Deno.env.get()`** in Business-Logik — Umgebungsvariablen gebündelt einlesen und weitergeben.
- **Terraform-State nie committen.** `*.tfstate`, `.terraform/`, `*.json` (SA-Keys) und `terraform.tfvars` sind in `infra/.gitignore`. `.terraform.lock.hcl` wird committet (laut Terraform-Doku).
- **SA-Key-Dateien gehören nicht ins Repo.** Service-Account-Keys in `infra/gcp/sa-key.json` bleiben lokal.
- **Dify-YAML-Änderungen dokumentieren.** Wenn du `Dify-Summarize.yml` änderst, erkläre dem User welche Nodes geändert wurden und dass ein manueller DSL-Import nötig ist.
- **Phasen nicht überspringen.** Phase 3 (Cleanup) muss vor Phase 4 (GCS) erledigt sein. Phase 4 vor Phase 5.

## Lokale Entwicklung

```bash
# Backend starten (Orchestrator)
cd src/backend
deno task dev

# File-Acceptor starten (solange noch benötigt, bis Phase 3)
deno task file

# Frontend starten
npm run dev
```

Voraussetzungen lokal:
- Deno 2.x installiert
- ffmpeg installiert (`brew install ffmpeg`)
- pdfcpu installiert (`brew install pdfcpu`)
- Laufende Dify-Instanz (lokal via Docker oder RPi)
- `src/backend/.env` befüllt (Vorlage: `src/backend/.env.example`)

## GCP / Terraform

```bash
cd infra/gcp
terraform init
terraform plan
terraform apply
```

GCP-Projekt: `anki-lm`, Region: `europe-west3`
GCS-Bucket: `ankilm-files`
Artifact Registry: `europe-west3-docker.pkg.dev/anki-lm/ankilm`

SA-Key nach `terraform apply` extrahieren:
```bash
terraform output -raw backend_sa_key_base64 | base64 -d > sa-key.json
```
Dann in `src/backend/.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=/absoluter/pfad/zu/infra/gcp/sa-key.json
GCS_BUCKET=ankilm-files
```

