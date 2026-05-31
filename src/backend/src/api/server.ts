import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";

import Path from "node:path";
import { ensureDir } from "@std/fs";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "../util/pdf.ts";
import {
  downloadFromGcs,
  uploadFileToGcs,
  writeTextToGcs,
} from "../util/storage.ts";
import { getFilesInFolder, sendDifyWorkflow } from "../util/orchestrationHelper.ts";
import { addOutputFile, createJob, getJob, listJobs, setJobStatus, updateJob } from "./jobQueue.ts";
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

async function processUpload(job: Job): Promise<void> {
  try {
    const tempDir = await Deno.makeTempDir({ prefix: `job_${job.id}_process_` });
    const mp3Path = Path.join(tempDir, "input.mp3");
    const pdfPath = Path.join(tempDir, "input.pdf");
    const forDifyPath = Path.join(tempDir, "for_dify");
    await ensureDir(forDifyPath);

    await downloadFromGcs(job.mp3GcsPath!, mp3Path);
    await downloadFromGcs(job.pdfGcsPath!, pdfPath);

    await transcribe(mp3Path, forDifyPath, tempDir);

    const pdfSuccess = await stampPdfWithSlideNumber(pdfPath, forDifyPath);
    if (!pdfSuccess) {
      console.warn(`PDF stamping failed for job ${job.id}, copying original`);
      const fallbackPath = Path.join(forDifyPath, Path.basename(pdfPath));
      await Deno.copyFile(pdfPath, fallbackPath);
    }

    const files = await getFilesInFolder(forDifyPath);
    const fileUrls = await Promise.all(
      files.map((f) =>
        uploadFileToGcs(f, `input/jobs/${job.id}/for_dify/${Path.basename(f)}`)
      ),
    );

    const outputPath = `jobs/${job.id}`;
    await sendDifyWorkflow(
      fileUrls, job.fach, job.lectureName, outputPath,
      (err) => setJobStatus(job.id, "failed", err),
      () => {
        // Safety net: Dify confirmed success — ensure job is marked processed
        // even if a concurrent webhook race condition under-counted.
        const j = getJob(job.id);
        if (j && j.status === "processing") setJobStatus(job.id, "processed");
      },
    );

    console.log(`Job ${job.id}: Dify workflow started`);
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err);
    setJobStatus(job.id, "failed", String(err));
  } finally {
    // The temp dir used for processing is cleaned up asynchronously.
    // Raw GCS uploads (mp3GcsPath / pdfGcsPath) are preserved for re-runs.
  }
}

const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ ok: true }));

// ── POST /api/jobs ──────────────────────────────────────────────────────────
// Step 1: upload files to GCS, create job in "preparing" state.
app.post("/api/jobs", async (c) => {
  const formData = await c.req.formData();
  const mp3File = formData.get("mp3");
  const pdfFile = formData.get("pdf");
  const fach = formData.get("fach");
  const lectureName = formData.get("lectureName");

  if (
    !(mp3File instanceof File) ||
    !(pdfFile instanceof File) ||
    typeof fach !== "string" ||
    typeof lectureName !== "string"
  ) {
    return c.json({ error: "Missing required fields: mp3, pdf, fach, lectureName" }, 400);
  }

  // Generate a temporary ID for the GCS paths; job will carry the real ID.
  const tempId = crypto.randomUUID();
  const mp3GcsPath = `input/jobs/${tempId}/raw/input.mp3`;
  const pdfGcsPath = `input/jobs/${tempId}/raw/input.pdf`;

  const stagingDir = await Deno.makeTempDir({ prefix: `job_upload_${tempId}_` });
  const mp3Local = Path.join(stagingDir, "input.mp3");
  const pdfLocal = Path.join(stagingDir, "input.pdf");

  try {
    await Deno.writeFile(mp3Local, new Uint8Array(await mp3File.arrayBuffer()));
    await Deno.writeFile(pdfLocal, new Uint8Array(await pdfFile.arrayBuffer()));

    await uploadFileToGcs(mp3Local, mp3GcsPath);
    await uploadFileToGcs(pdfLocal, pdfGcsPath);
  } finally {
    await Deno.remove(stagingDir, { recursive: true }).catch(() => {});
  }

  const job = createJob(fach, lectureName, mp3GcsPath, pdfGcsPath);
  console.log(`Job ${job.id}: created in preparing state`);

  return c.json({ jobId: job.id }, 202);
});

// ── POST /api/jobs/:id/start ────────────────────────────────────────────────
// Step 2: trigger AI pipeline for an existing "preparing" job.
app.post("/api/jobs/:id/start", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "preparing" && job.status !== "failed") {
    return c.json({ error: `Job is already in status: ${job.status}` }, 409);
  }

  // Clear any previous error before re-running.
  updateJob(job.id, { status: "processing", error: undefined });
  // Fire and forget — pipeline runs asynchronously.
  processUpload(job);

  console.log(`Job ${job.id}: pipeline started`);
  return c.json({ ok: true }, 202);
});

// ── GET /api/jobs ───────────────────────────────────────────────────────────
app.get("/api/jobs", (c) => c.json(listJobs()));

// ── GET /api/jobs/:id ───────────────────────────────────────────────────────
app.get("/api/jobs/:id", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  return c.json(job);
});

// ── POST /api/webhook/dify ──────────────────────────────────────────────────
app.post("/api/webhook/dify", async (c) => {
  const env = getEnv();

  const authHeader = c.req.header("Authorization");
  if (authHeader !== `Bearer ${env.fileAcceptorSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const fileName = c.req.query("fileName");
  if (!fileName) {
    return c.json({ error: "Missing fileName query param" }, 400);
  }

  // fileName format: jobs/<jobId>/<fach>_<lectureName>_0N-<type>.md
  const parts = fileName.split("/");
  if (parts.length < 3 || parts[0] !== "jobs") {
    return c.json({ error: "Invalid fileName format" }, 400);
  }
  const jobId = parts[1];
  const baseName = parts[2];

  const job = getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  const gcsPath = `output/${job.fach}/${job.lectureName}/${baseName}`;
  const content = await c.req.text();
  const signedUrl = await writeTextToGcs(gcsPath, content);

  // Key: strip "<fach>_<lectureName>_" prefix and ".md" suffix → "01-summary" etc.
  const typeKey = baseName.replace(/^[^_]+_[^_]+_/, "").replace(/\.md$/, "");

  // Synchronous mutation — safe against concurrent webhook calls losing one file.
  const count = addOutputFile(jobId, typeKey, signedUrl);
  if (count >= EXPECTED_OUTPUT_COUNT) {
    setJobStatus(jobId, "processed");
  }

  console.log(`Job ${jobId}: received output "${typeKey}" (${count}/${EXPECTED_OUTPUT_COUNT})`);

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

Deno.serve({ port }, app.fetch);
