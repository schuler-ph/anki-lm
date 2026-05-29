import { Hono } from "@hono/hono";

import Path from "node:path";
import { ensureDir } from "@std/fs";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "../util/pdf.ts";
import { uploadFileToGcs, writeTextToGcs } from "../util/storage.ts";
import { getFilesInFolder } from "../util/orchestrationHelper.ts";
import { sendDifyWorkflow } from "../util/orchestrationHelper.ts";
import { createJob, getJob, setJobStatus, updateJob } from "./jobQueue.ts";
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

async function processUpload(
  job: Job,
  mp3Path: string,
  pdfPath: string,
): Promise<void> {
  try {
    setJobStatus(job.id, "processing");

    const forDifyPath = Path.join(Path.dirname(mp3Path), "for_dify");
    await ensureDir(forDifyPath);

    await transcribe(mp3Path, forDifyPath);

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
    await sendDifyWorkflow(fileUrls, job.fach, job.lectureName, outputPath);

    console.log(`Job ${job.id}: Dify workflow started`);
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err);
    setJobStatus(job.id, "failed", String(err));
  } finally {
    // Clean up temp dir
    const tempDir = Path.dirname(mp3Path);
    await Deno.remove(tempDir, { recursive: true }).catch(() => {});
  }
}

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/upload", async (c) => {
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

  const job = createJob(fach, lectureName);
  const tempDir = await Deno.makeTempDir({ prefix: `job_${job.id}_` });
  const mp3Path = Path.join(tempDir, "input.mp3");
  const pdfPath = Path.join(tempDir, "input.pdf");

  await Deno.writeFile(mp3Path, new Uint8Array(await mp3File.arrayBuffer()));
  await Deno.writeFile(pdfPath, new Uint8Array(await pdfFile.arrayBuffer()));

  // Fire and forget
  processUpload(job, mp3Path, pdfPath);

  return c.json({ jobId: job.id }, 202);
});

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

  const job = getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  const baseName = parts[2];
  const gcsPath = `output/${job.fach}/${job.lectureName}/${baseName}`;

  const content = await c.req.text();
  const signedUrl = await writeTextToGcs(gcsPath, content);

  const outputFiles = [...job.outputFiles, signedUrl];
  const newStatus = outputFiles.length >= EXPECTED_OUTPUT_COUNT
    ? "completed"
    : job.status;
  updateJob(jobId, { outputFiles, status: newStatus });

  console.log(
    `Job ${jobId}: received ${outputFiles.length}/${EXPECTED_OUTPUT_COUNT} output files`,
  );

  return c.json({ ok: true });
});

app.get("/api/jobs/:id", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  return c.json(job);
});

const port = parseInt(Deno.env.get("PORT") ?? "8080", 10);
console.log(`Starting AnkiLM backend API on port ${port}`);

// Validate env at startup
try {
  getEnv();
} catch (err) {
  console.error("Startup failed:", err);
  Deno.exit(1);
}

Deno.serve({ port }, app.fetch);
