import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";

import Path from "node:path";
import { ensureDir } from "@std/fs";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "../util/pdf.ts";
import {
  downloadFromGcs,
  getSignedUploadUrl,
  getSignedUrl,
  listGcsFiles,
  readBytesFromGcs,
  readTextFromGcs,
  uploadFileToGcs,
  writeTextToGcs,
} from "../util/storage.ts";
import { createZipStream, TextReader, Uint8ArrayReader } from "../util/zip.ts";
import type { ZipEntry } from "../util/zip.ts";
import {
  getFilesInFolder,
  sendDifyWorkflow,
} from "../util/orchestrationHelper.ts";
import {
  addOutputFile,
  createJob,
  getJob,
  listJobs,
  resetOrphanedJobs,
  setFachDisplayName,
  setJobStatus,
  updateJob,
} from "./jobQueue.ts";
import { requireAuth } from "./auth.ts";
import type { Job } from "./types.ts";

interface Env {
  gcsBucket: string;
  gcpProjectId: string;
  difyApiUrl: string;
  difyApiKey: string;
  fileAcceptorSecret: string;
  googleCredentials: string | undefined;
}

function getEnv(): Env {
  function req(key: string): string {
    const v = Deno.env.get(key);
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
  }
  return {
    gcsBucket: req("GCS_BUCKET"),
    gcpProjectId: req("GCP_PROJECT_ID"),
    difyApiUrl: req("DIFY_API_URL"),
    difyApiKey: req("DIFY_API_KEY"),
    fileAcceptorSecret: req("FILE_ACCEPTOR_SECRET"),
    googleCredentials: Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS"),
  };
}

const EXPECTED_OUTPUT_COUNT = 6;

// Tracks in-flight processUpload promises so the SIGTERM handler can wait for them.
const activeJobs = new Set<Promise<void>>();

async function processUpload(job: Job): Promise<void> {
  try {
    const forDifyGcsPrefix = `input/${job.userId}/jobs/${job.id}/for_dify/`;
    const existingGcsPaths = await listGcsFiles(forDifyGcsPrefix);

    let fileUrls: string[];

    if (existingGcsPaths.length > 0) {
      console.log(
        `Job ${job.id}: reusing ${existingGcsPaths.length} existing for_dify files`,
      );
      fileUrls = await Promise.all(
        existingGcsPaths.map((p) => getSignedUrl(p)),
      );
    } else {
      const tempDir = await Deno.makeTempDir({
        prefix: `job_${job.id}_process_`,
      });
      const forDifyPath = Path.join(tempDir, "for_dify");
      await ensureDir(forDifyPath);

      const mp3Paths = await Promise.all(
        job.mp3GcsPaths.map(async (gcsPath, i) => {
          const p = Path.join(tempDir, `input_${i}.mp3`);
          await downloadFromGcs(gcsPath, p);
          return p;
        }),
      );

      const pdfPaths = await Promise.all(
        job.pdfGcsPaths.map(async (gcsPath, i) => {
          const p = Path.join(tempDir, `input_${i}.pdf`);
          await downloadFromGcs(gcsPath, p);
          return p;
        }),
      );

      for (const mp3Path of mp3Paths) {
        await transcribe(mp3Path, forDifyPath, tempDir);
      }

      for (const pdfPath of pdfPaths) {
        const pdfSuccess = await stampPdfWithSlideNumber(pdfPath, forDifyPath);
        if (!pdfSuccess) {
          console.warn(
            `PDF stamping failed for job ${job.id}, copying ${Path.basename(pdfPath)}`,
          );
          await Deno.copyFile(
            pdfPath,
            Path.join(forDifyPath, Path.basename(pdfPath)),
          );
        }
      }

      const files = await getFilesInFolder(forDifyPath);
      fileUrls = await Promise.all(
        files.map((f) =>
          uploadFileToGcs(f, `${forDifyGcsPrefix}${Path.basename(f)}`),
        ),
      );
    }

    const outputPath = job.id;
    await sendDifyWorkflow(
      fileUrls,
      job.fach,
      job.lectureName,
      outputPath,
      async (err) => {
        await setJobStatus(job.id, "failed", err);
      },
      async () => {
        const j = await getJob(job.id);
        if (j && j.status === "processing")
          await setJobStatus(job.id, "processed");
      },
    );

    console.log(`Job ${job.id}: Dify workflow started`);
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err);
    await setJobStatus(job.id, "failed", String(err));
  }
}

const app = new Hono<{ Variables: { userId: string } }>();

app.use(
  "*",
  cors({ origin: "*", exposeHeaders: ["Content-Disposition"] }),
);

app.get("/health", (c) => c.json({ ok: true }));

// Auth middleware — applied to all /api/jobs routes; webhook uses shared secret instead.
app.use("/api/jobs", requireAuth);
app.use("/api/jobs/*", requireAuth);
app.use("/api/topics/*", requireAuth);
app.use("/api/export", requireAuth);

// ── POST /api/jobs ──────────────────────────────────────────────────────────
// Step 1: upload files to GCS, create job in "preparing" state.
app.post("/api/jobs", async (c) => {
  const userId = c.get("userId");

  type FileDesc = {
    name: string;
    fileType: "mp3" | "pdf";
    contentType: string;
  };
  const body = await c.req.json<{
    fach: string;
    lectureName: string;
    fachDisplayName?: string;
    files: FileDesc[];
  }>();

  const { fach, lectureName, fachDisplayName, files } = body;
  if (!fach || !lectureName || !Array.isArray(files) || files.length === 0) {
    return c.json(
      { error: "Missing required fields: fach, lectureName, files" },
      400,
    );
  }

  const mp3Files = files.filter((f) => f.fileType === "mp3");
  const pdfFiles = files.filter((f) => f.fileType === "pdf");
  if (mp3Files.length === 0 || pdfFiles.length === 0) {
    return c.json(
      { error: "At least one mp3 and one pdf file descriptor required" },
      400,
    );
  }

  const jobId = crypto.randomUUID();

  // Pre-assign GCS paths and generate signed PUT URLs — no file bytes touch Cloud Run.
  const mp3GcsPaths = mp3Files.map(
    (_, i) => `input/${userId}/jobs/${jobId}/raw/mp3_${i}.mp3`,
  );
  const pdfGcsPaths = pdfFiles.map(
    (_, i) => `input/${userId}/jobs/${jobId}/raw/pdf_${i}.pdf`,
  );
  const mp3OriginalNames = mp3Files.map((f) => f.name);
  const pdfOriginalNames = pdfFiles.map((f) => f.name);

  const uploadUrls = await Promise.all([
    ...mp3Files.map((f, i) =>
      getSignedUploadUrl(mp3GcsPaths[i], f.contentType || "audio/mpeg").then(
        (signedUrl) => ({
          index: i,
          fileType: "mp3" as const,
          gcsPath: mp3GcsPaths[i],
          signedUrl,
        }),
      ),
    ),
    ...pdfFiles.map((f, i) =>
      getSignedUploadUrl(
        pdfGcsPaths[i],
        f.contentType || "application/pdf",
      ).then((signedUrl) => ({
        index: i,
        fileType: "pdf" as const,
        gcsPath: pdfGcsPaths[i],
        signedUrl,
      })),
    ),
  ]);

  const job = await createJob(
    userId,
    fach,
    lectureName,
    mp3GcsPaths,
    pdfGcsPaths,
    mp3OriginalNames,
    pdfOriginalNames,
    fachDisplayName?.trim() || undefined,
    jobId,
  );
  console.log(
    `Job ${job.id}: created (${mp3GcsPaths.length} MP3, ${pdfGcsPaths.length} PDF), signed upload URLs issued`,
  );

  return c.json({ jobId: job.id, uploadUrls }, 202);
});

// ── POST /api/jobs/:id/start ────────────────────────────────────────────────
// Step 2: trigger AI pipeline for an existing "preparing" or "failed" job.
app.post("/api/jobs/:id/start", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId"))
    return c.json({ error: "Forbidden" }, 403);
  if (
    job.status !== "preparing" &&
    job.status !== "failed" &&
    job.status !== "processing"
  ) {
    return c.json({ error: `Job is already in status: ${job.status}` }, 409);
  }

  await updateJob(job.id, { status: "processing", error: undefined });

  const p = processUpload(job).finally(() => activeJobs.delete(p!));
  activeJobs.add(p);

  console.log(`Job ${job.id}: pipeline started`);
  return c.json({ ok: true }, 202);
});

// ── GET /api/jobs ───────────────────────────────────────────────────────────
app.get("/api/jobs", async (c) => c.json(await listJobs(c.get("userId"))));

// ── GET /api/jobs/:id ───────────────────────────────────────────────────────
app.get("/api/jobs/:id", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId"))
    return c.json({ error: "Forbidden" }, 403);
  return c.json(job);
});

// ── GET /api/jobs/:id/intermediates ─────────────────────────────────────────
// Returns transcript (.txt) and stamped PDF from the for_dify/ GCS folder
// with short-lived signed download URLs.
app.get("/api/jobs/:id/intermediates", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId"))
    return c.json({ error: "Forbidden" }, 403);

  const prefix = `input/${job.userId}/jobs/${job.id}/for_dify/`;
  const gcsPaths = await listGcsFiles(prefix);
  const files = await Promise.all(
    gcsPaths.map(async (gcsPath) => ({
      name: gcsPath.split("/").pop()!,
      url: await getSignedUrl(gcsPath),
    })),
  );
  return c.json(files);
});

// ── GET /api/export ─────────────────────────────────────────────────────────
// Streams a ZIP bundle of output files across the user's lectures.
//   type  = slides | summary | veredelt | tldr | konzepte | beispiele | anki | all
//   scope = all | fach:<fach>
// Markdown outputs are bundled as-is; "anki" is converted to Anki-importable CSV
// (one file per note-type section). "slides" bundles the raw uploaded PDFs.
// Logical export type names (URL param values). Actual keys in job.outputFiles
// follow the pattern "<NN>-<name>" (e.g. "01-summary"), so we match by suffix.
const OUTPUT_KEYS = [
  "summary",
  "veredelt",
  "tldr",
  "konzepte",
  "beispiele",
  "anki",
] as const;

type OutputKey = (typeof OUTPUT_KEYS)[number];

// Returns the GCS path for the given logical key from a job's outputFiles map,
// handling both bare keys ("anki") and prefixed keys ("06-anki").
function findOutputGcsPath(
  outputFiles: Record<string, string>,
  key: OutputKey,
): string | undefined {
  if (outputFiles[key]) return outputFiles[key];
  const prefixed = Object.keys(outputFiles).find(
    (k) => k === key || k.endsWith(`-${key}`),
  );
  return prefixed ? outputFiles[prefixed] : undefined;
}

function sanitizeName(s: string): string {
  return s
    .replace(/[^\p{L}\p{N}\-_.]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

app.get("/api/export", async (c) => {
  const userId = c.get("userId");
  const type = c.req.query("type") ?? "all";
  const scope = c.req.query("scope") ?? "all";

  let jobs = await listJobs(userId);
  if (scope.startsWith("fach:")) {
    const fach = scope.slice("fach:".length);
    jobs = jobs.filter((j) => j.fach === fach);
  }

  const wantsSlides = type === "slides" || type === "all";
  const outputKeys =
    type === "all"
      ? OUTPUT_KEYS
      : (OUTPUT_KEYS as readonly string[]).includes(type)
        ? [type]
        : [];

  if (!wantsSlides && outputKeys.length === 0) {
    return c.json({ error: `Unknown export type: ${type}` }, 400);
  }

  const entries: ZipEntry[] = [];
  const usedNames = new Set<string>();

  function uniqueName(preferred: string): string {
    if (!usedNames.has(preferred)) {
      usedNames.add(preferred);
      return preferred;
    }
    const dot = preferred.lastIndexOf(".");
    const base = dot >= 0 ? preferred.slice(0, dot) : preferred;
    const ext = dot >= 0 ? preferred.slice(dot) : "";
    for (let i = 2; ; i++) {
      const candidate = `${base}_${i}${ext}`;
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }
  }

  for (const job of jobs) {
    const fachDir = sanitizeName(job.fach.toLowerCase());
    const lectureName = sanitizeName(job.lectureName);

    if (wantsSlides) {
      job.pdfGcsPaths.forEach((gcsPath, i) => {
        const original = job.pdfOriginalNames?.[i];
        const fileName = original ? sanitizeName(original) : `${lectureName}_${i + 1}.pdf`;
        entries.push({
          name: uniqueName(`${fachDir}/slides/${fileName}`),
          open: async () => new Uint8ArrayReader(await readBytesFromGcs(gcsPath)),
        });
      });
    }

    for (const key of outputKeys) {
      const gcsPath = findOutputGcsPath(job.outputFiles, key as OutputKey);
      if (!gcsPath) continue;
      entries.push({
        name: uniqueName(`${fachDir}/${key}/${lectureName}.md`),
        open: () => readTextFromGcs(gcsPath).then((text) => new TextReader(text)),
      });
    }
  }

  if (entries.length === 0) {
    return c.json({ error: "Keine passenden Dateien zum Export gefunden" }, 404);
  }

  const scopeLabel = scope.startsWith("fach:")
    ? sanitizeName(scope.slice("fach:".length))
    : "alle";
  const fileName = `ankilm_${scopeLabel}_${type}.zip`;

  return new Response(createZipStream(entries), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
});

// ── PATCH /api/topics/:fach ─────────────────────────────────────────────────
// Update the display name for all jobs of a given fach.
app.patch("/api/topics/:fach", async (c) => {
  const userId = c.get("userId");
  const fach = c.req.param("fach");
  const body = await c.req.json<{ displayName?: string | null }>();
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : undefined;
  await setFachDisplayName(userId, fach, displayName);
  return c.json({ ok: true });
});

// ── GET /api/jobs/:id/output/:key ───────────────────────────────────────────
// Proxies the GCS output file through the backend to avoid browser CORS issues.
app.get("/api/jobs/:id/output/:key", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId"))
    return c.json({ error: "Forbidden" }, 403);
  const key = c.req.param("key");
  const gcsPath = job.outputFiles[key];
  if (!gcsPath) return c.json({ error: "Output not found" }, 404);

  try {
    const text = await readTextFromGcs(gcsPath);
    return c.text(text, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  } catch {
    return c.json({ error: "Failed to fetch from GCS" }, 500);
  }
});

// ── POST /api/webhook/dify ──────────────────────────────────────────────────
// ── POST /api/webhook/dify ──────────────────────────────────────────────────
// Dify sends structured query params — no name parsing on this side.
app.post("/api/webhook/dify", async (c) => {
  const env = getEnv();

  const authHeader = c.req.header("Authorization");
  if (authHeader !== `Bearer ${env.fileAcceptorSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jobId = c.req.query("jobId");
  const key = c.req.query("key");
  if (!jobId || !key) {
    return c.json({ error: "Missing jobId or key query param" }, 400);
  }

  const job = await getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  const fileName = `${job.fach}_${job.lectureName}_${key}.md`;
  const gcsPath = `output/${job.userId}/${job.fach}/${job.lectureName}/${fileName}`;

  const content = await c.req.text();
  await writeTextToGcs(gcsPath, content);

  const count = await addOutputFile(jobId, key, gcsPath);
  if (count >= EXPECTED_OUTPUT_COUNT) {
    await setJobStatus(jobId, "processed");
  }

  console.log(
    `Job ${jobId}: received output "${key}" (${count}/${EXPECTED_OUTPUT_COUNT})`,
  );

  return c.json({ ok: true });
});

const port = parseInt(Deno.env.get("PORT") ?? "8080", 10);
console.log(`Starting AnkiLM backend API on port ${port}`);

try {
  getEnv();
} catch (err) {
  console.error("Startup failed:", err);
  Deno.exit(1);
}

// Recover jobs that were stuck in "processing" from a previous instance.
resetOrphanedJobs()
  .then((n) => {
    if (n > 0)
      console.log(`Startup: reset ${n} orphaned processing job(s) to failed`);
  })
  .catch((err) => console.error("resetOrphanedJobs failed:", err));

// Graceful shutdown: Cloud Run sends SIGTERM before killing the instance.
// Wait up to 290 s for active pipelines to finish, then exit cleanly.
Deno.addSignalListener("SIGTERM", async () => {
  console.log(
    `SIGTERM received — waiting for ${activeJobs.size} active pipeline(s)…`,
  );
  const deadline = new Promise<void>((r) => setTimeout(r, 290_000));
  await Promise.race([Promise.allSettled([...activeJobs]), deadline]);
  console.log("Shutdown complete.");
  Deno.exit(0);
});

Deno.serve({ port }, app.fetch);
