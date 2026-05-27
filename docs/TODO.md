# AnkiLM – TODO

Phasen sind aufsteigend nach Aufwand sortiert (kleinstes zuerst).
Jeder Schritt ist atomar und unabhängig ausführbar.

---

## Phase 1 – Sicherheit & Environment-Hygiene

> Aufwand: ~1h | Voraussetzung: keine

- [x] `.env`-Datei aus git-History entfernen → war nie committet, kein Handlungsbedarf
- [x] `.env` zu `.gitignore` in `src/backend/` hinzufügen → war bereits eingetragen
- [x] `src/backend/.env.example` erstellen mit allen Keys als Platzhalter (ohne echte Werte)
- [x] Root `.env.example` erstellen für Frontend-Variablen (`VITE_BACKEND_URL`, etc.)
- [ ] README-Abschnitt "Setup" ergänzen: welche `.env`-Variablen wo benötigt werden
- [ ] `orchestrationHelper.ts`: hardcodierte `http://localhost:8019` → `Deno.env.get("FILE_SERVER_URL")`
- [ ] `orchestrationHelper.ts`: hardcodierte `http://localhost:8099` → `Deno.env.get("DIFY_API_URL")`

---

## Phase 2 – File-Naming Convention

> Aufwand: ~2h | Voraussetzung: keine

**Problem:** Im AI-Chat-Kontext ist unklar, welche Datei welchem Fach/Vorlesung gehört.
**Lösung:** Einheitliches Schema `<FACH>_<VorlesungName>_<contentType>.<ext>`  
Beispiel: `EAI_ArchitekturMuster_summary.md`, `LAR_Vorlesung3_transcript.txt`, `IID_Einfuehrung_flashcards.md`

- [ ] Naming-Schema final festlegen und in README dokumentieren
- [ ] Alle bestehenden Output-Dateien in `data/03-out/` nach Schema umbenennen (manuell oder Skript)
- [ ] `src/backend/src/orchestrator.ts`: Output-Dateinamen beim Schreiben auf Schema umstellen
- [ ] Dify-Workflow: Output-Dateinamen-Variable auf Schema aktualisieren
- [ ] Optional: `src/backend/src/` – Hilfsfunktion `buildFileName(fach, vorlesung, type, ext)` extrahieren

---

## Phase 3 – fileAcceptor.ts entfernen

> Aufwand: ~2–3h | Voraussetzung: Phase 5 oder 6 (Cloud Storage) abgeschlossen

**Aktuell:** Dify-Workflow schreibt Ergebnisse via HTTP POST an `localhost:8019` (fileAcceptor).  
**Ziel:** Direkt in Cloud-Bucket oder Google Drive schreiben – kein lokaler File-Server mehr.

- [ ] Alle Aufrufe von `fileAcceptor` in `orchestrationHelper.ts` identifizieren (`checkHealth`, `toFileServerPath`)
- [ ] `checkHealth()`-Funktion aus `orchestrationHelper.ts` entfernen
- [ ] `toFileServerPath()` aus `storageRoot.ts` entfernen
- [ ] `sendDifyRequest()` anpassen: Output-Pfad nicht mehr als HTTP-URL übergeben, sondern als Bucket-Pfad
- [ ] Dify-Workflow aktualisieren: statt HTTP POST an fileAcceptor → direkt in Bucket schreiben (HTTP-Request-Node oder Storage-Plugin)
- [ ] `src/backend/src/fileAcceptor.ts` löschen
- [ ] `deno.json` Task `"file"` entfernen
- [ ] `BACKEND.MD` aktualisieren (Architekturdiagramm ohne fileAcceptor)

---

## Phase 4 – Frontend von GitHub Pages lösen & hosten

> Aufwand: ~2–3h | Voraussetzung: keine (unabhängig vom Backend)

**Aktuell:** Vite base `/anki-lm/` → statisch auf GitHub Pages, kein Backend-Zugriff möglich.  
**Vorschlag Hosting:** **Vercel** (kostenlos, zero-config für Vite/React, eigene Domain, Env-Vars über UI)

> Envoy ist ein Service-Mesh-Proxy – für dieses Setup Overkill. Für ein einfaches "Frontend spricht mit Backend-API" reicht ein normaler Reverse-Proxy (Caddy/nginx in Docker, oder Vercel Rewrites).

- [ ] Vercel-Account anlegen (oder Netlify als Alternative)
- [ ] `vite.config.ts`: `base: '/anki-lm/'` auf `base: '/'` ändern
- [ ] `VITE_BACKEND_URL` als Env-Variable einführen (aktuell hardcoded?)
- [ ] Alle hardcodierten Backend-URLs im Frontend auf `import.meta.env.VITE_BACKEND_URL` umstellen
- [ ] `vercel.json` erstellen mit Rewrite-Regel: `/api/*` → Backend-URL (verhindert CORS-Probleme)
- [ ] GitHub-Repo mit Vercel verbinden (automatisches Deploy bei Push)
- [ ] `VITE_BACKEND_URL` in Vercel-Dashboard als Environment Variable setzen
- [ ] GitHub Pages Deployment aus `package.json` / Workflow entfernen
- [ ] README: Deployment-Abschnitt aktualisieren

---

## Phase 5 – Cloud Storage statt lokalem Dateisystem

> Aufwand: ~3–4h | Voraussetzung: Phase 3 (fileAcceptor entfernen)

**Optionen:**

- **Google Cloud Storage (GCS)** – passt, da du Google Drive bereits nutzt, gute Deno-SDK-Unterstützung
- **Direkter Google Drive Upload** – einfacher Zugriff, aber kein API-freundlicher Bucket

**Empfehlung: GCS** (günstiger als Drive für programmatischen Zugriff, CLI-freundlich, gut mit Dify integrierbar)

- [ ] GCS Bucket anlegen (z.B. `anki-lm-outputs`)
- [ ] Service-Account mit `Storage Object Admin`-Rolle erstellen, JSON-Key herunterladen
- [ ] `GOOGLE_APPLICATION_CREDENTIALS`-Pfad in `.env.example` ergänzen
- [ ] Deno GCS-Client einbinden (`npm:@google-cloud/storage` via Deno npm compat)
- [ ] `src/backend/src/storage.ts` neu erstellen: `uploadFile(localPath, bucketPath)` und `downloadFile(bucketPath, localPath)`
- [ ] `orchestrationHelper.ts`: `sendDifyRequest()` – nach Dify-Lauf Output aus `from_dify/` in Bucket hochladen
- [ ] Frontend: Dateien nicht mehr aus `dist/` laden, sondern aus öffentlichem GCS-Bucket (oder signierten URLs)
- [ ] Bucket-Berechtigungen setzen (öffentlich lesbar für Study-Outputs, oder signed URLs)
- [ ] `.env.example` um GCS-Variablen ergänzen

---

## Phase 6 – Frontend & Backend in Docker containerisieren

> Aufwand: ~4–5h | Voraussetzung: Phase 4 (Frontend entkoppelt)

**Ziel:** Gesamtes System mit `docker compose up` startbar – lokal und auf Server/RPi deploybar.

### 6a – Backend (Deno Orchestrator)

- [ ] `src/backend/Dockerfile` erstellen (Basis: `denoland/deno:alpine`, multi-stage)
- [ ] `.dockerignore` für `src/backend/` anlegen
- [ ] Deno-Permissions in Dockerfile korrekt setzen (`--allow-net --allow-read --allow-write --allow-run --allow-env`)
- [ ] System-Dependencies im Dockerfile installieren: `ffmpeg`, `pdfcpu` (oder als Binary kopieren)
- [ ] Backend-Image lokal bauen und testen: `docker build -t anki-lm-backend ./src/backend`

### 6b – Frontend (React/Vite)

- [ ] `Dockerfile` im Root erstellen (multi-stage: `node:alpine` build → `nginx:alpine` serve)
- [ ] nginx-Config (`nginx.conf`) erstellen: SPA-Routing (`try_files $uri /index.html`), Proxy `/api/` → Backend
- [ ] `.dockerignore` im Root anlegen
- [ ] Frontend-Image lokal bauen und testen

### 6c – Docker Compose

- [ ] `docker-compose.yml` im Root erstellen mit Services: `frontend`, `backend`
- [ ] Shared Network zwischen frontend und backend definieren
- [ ] Volume für Backend-Outputs mounten (`./data:/app/data`)
- [ ] `env_file` in docker-compose auf `.env` verweisen
- [ ] `docker compose up` lokal testen, Logs prüfen
- [ ] `docker-compose.override.yml` für lokale Dev-Einstellungen erstellen (hot reload, etc.)

---

## Phase 7 – Dify deployen (Cloud oder Raspberry Pi)

> Aufwand: ~4–6h | Voraussetzung: Phase 6

**Optionen:**

- **Raspberry Pi 4/5** (8GB RAM empfohlen) – günstiger, volle Kontrolle, läuft 24/7 im LAN
- **Cloud (Hetzner VPS CX22, ~4€/Monat)** – öffentlich erreichbar, kein Stromverbrauch, einfacheres Networking

**Empfehlung:** Hetzner Cloud VPS (ARM-Instanz, günstig, ARM-Images für Dify verfügbar) – wenn RPi, dann als Fallback.

### 7a – Server vorbereiten

- [ ] Server aufsetzen (Ubuntu 24.04 LTS)
- [ ] Docker & Docker Compose installieren
- [ ] SSH-Key-Auth einrichten, Root-Login deaktivieren
- [ ] Firewall konfigurieren: nur Port 22, 80, 443 öffnen

### 7b – Dify deployen

- [ ] `docker-compose.yaml` (Dify, aus diesem Repo) auf Server kopieren
- [ ] `.env` für Dify auf Server anlegen (Secrets, API-Keys)
- [ ] `docker compose up -d` ausführen
- [ ] Dify Health-Check: `curl http://localhost/health`
- [ ] Dify initial Setup (Admin-User, Workspace) über Web-UI durchführen
- [ ] Bestehenden Dify-Workflow importieren (DSL-Export vom lokalen Dify)

### 7c – Reverse Proxy (Caddy – empfohlen statt nginx/Envoy)

- [ ] `Caddyfile` erstellen: `dify.deinedomain.com → localhost:80`, `api.deinedomain.com → backend:PORT`
- [ ] Caddy als Docker-Service in `docker-compose.yaml` ergänzen
- [ ] Domain DNS-Einträge setzen (A-Record auf Server-IP)
- [ ] HTTPS automatisch via Caddy Let's Encrypt testen

---

## Phase 8 – Full-Stack Integration

> Aufwand: ~2–3h | Voraussetzung: Phasen 4, 5, 6, 7

- [ ] Backend `DIFY_API_URL` von `localhost` auf `https://dify.deinedomain.com` umstellen
- [ ] Frontend `VITE_BACKEND_URL` auf deployed Backend-URL setzen
- [ ] End-to-End-Test: Datei droppen → Orchestrator → Dify → GCS → Frontend zeigt Ergebnis
- [ ] CORS-Header im Backend prüfen: nur Vercel-Domain erlauben (kein Wildcard `*`)
- [ ] Dify-Workflow: `fileAcceptor`-HTTP-Nodes auf GCS-Nodes umstellen
- [ ] API-Keys rotieren (alle lokalen Keys ungültig machen, neue für Prod anlegen)

---

## Phase 9 – Usability & Developer Experience

> Aufwand: je ~1–2h pro Schritt | Voraussetzung: beliebig

### 9a – Output-Viewing im Frontend

- [ ] Frontend: Dateiliste aus GCS-Bucket laden und anzeigen (nach Fach gruppiert)
- [ ] Filter/Suche nach Fach, Vorlesung, Content-Type einbauen
- [ ] Direkter Download-Link pro Datei aus GCS (signed URL oder public)
- [ ] Markdown-Preview direkt im Browser für `_summary.md`-Dateien

### 9b – Upload-Flow im Frontend

- [ ] Upload-Formular: MP3 + PDF per Drag & Drop in GCS-Bucket hochladen
- [ ] Nach Upload: Orchestrator-Endpoint triggern (HTTP POST)
- [ ] Status-Anzeige: "Wird verarbeitet…" → Polling oder WebSocket auf Backend
- [ ] Fehlermeldungen anzeigen (Transkription fehlgeschlagen, etc.)

### 9c – Monitoring & Logging

- [ ] Backend: strukturiertes Logging einführen (`console.log` → JSON-Format mit Timestamp, Level, Subject)
- [ ] Dify: Workflow-Run-History regelmäßig exportieren (Kosten-Tracking)
- [ ] Optional: Uptime-Monitoring für Dify-Instanz (UptimeRobot Free Tier)
- [ ] GCS: Bucket-Lifecycle-Policy setzen (alte Outputs nach 90 Tagen archivieren)

### 9d – CI/CD

- [ ] GitHub Actions Workflow: Frontend auf Vercel deployen bei Push auf `main`
- [ ] GitHub Actions: Docker-Images bauen und auf GHCR (GitHub Container Registry) pushen
- [ ] Server: Watchtower-Container für automatisches Pullen neuer Images einrichten
- [ ] `.github/workflows/test.yml`: TypeScript-Typecheck + Lint auf PRs

### 9e – Anki-Export-Integration

- [ ] `_flashcards.md` automatisch in Anki-kompatibles `.apkg`-Format konvertieren (via `genanki` Python-Skript oder Dify-Node)
- [ ] Fertige `.apkg`-Dateien ebenfalls in GCS hochladen
- [ ] Frontend: direkter "In Anki importieren"-Download-Button

---

## Entscheidungs-Log

| Entscheidung       | Empfehlung                      | Alternative                       |
| ------------------ | ------------------------------- | --------------------------------- |
| Frontend Hosting   | Vercel (zero-config, kostenlos) | Netlify                           |
| Backend Proxy      | Caddy (Auto-HTTPS, einfach)     | nginx, Traefik                    |
| Cloud Storage      | Google Cloud Storage            | Cloudflare R2 (günstiger)         |
| Dify Hosting       | Hetzner VPS CX22 (~4€/mo)       | Raspberry Pi 4/5                  |
| Reverse Proxy Arch | Caddy vor allem                 | Envoy (Overkill für dieses Setup) |
