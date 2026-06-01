import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";

import Path from "node:path";
import { ensureDir } from "@std/fs";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "../util/pdf.ts";
import {
  downloadFromGcs,
  getSignedUrl,
  listGcsFiles,
  readTextFromGcs,
  uploadFileToGcs,
  writeTextToGcs,
} from "../util/storage.ts";
import { getFilesInFolder, sendDifyWorkflow } from "../util/orchestrationHelper.ts";
import { addOutputFile, createJob, getJob, listJobs, setFachDisplayName, setJobStatus, updateJob } from "./jobQueue.ts";
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

async function processUpload(job: Job): Promise<void> {
  try {
    const forDifyGcsPrefix = `input/${job.userId}/jobs/${job.id}/for_dify/`;
    const existingGcsPaths = await listGcsFiles(forDifyGcsPrefix);

    let fileUrls: string[];

    if (existingGcsPaths.length > 0) {
      console.log(`Job ${job.id}: reusing ${existingGcsPaths.length} existing for_dify files`);
      fileUrls = await Promise.all(existingGcsPaths.map((p) => getSignedUrl(p)));
    } else {
      const tempDir = await Deno.makeTempDir({ prefix: `job_${job.id}_process_` });
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
          console.warn(`PDF stamping failed for job ${job.id}, copying ${Path.basename(pdfPath)}`);
          await Deno.copyFile(pdfPath, Path.join(forDifyPath, Path.basename(pdfPath)));
        }
      }

      const files = await getFilesInFolder(forDifyPath);
      fileUrls = await Promise.all(
        files.map((f) =>
          uploadFileToGcs(f, `${forDifyGcsPrefix}${Path.basename(f)}`)
        ),
      );
    }

    const outputPath = `jobs/${job.id}`;
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
        if (j && j.status === "processing") await setJobStatus(job.id, "processed");
      },
    );

    console.log(`Job ${job.id}: Dify workflow started`);
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err);
    await setJobStatus(job.id, "failed", String(err));
  }
}

const app = new Hono<{ Variables: { userId: string } }>();

app.use("*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ ok: true }));

// Auth middleware — applied to all /api/jobs routes; webhook uses shared secret instead.
app.use("/api/jobs", requireAuth);
app.use("/api/jobs/*", requireAuth);
app.use("/api/topics/*", requireAuth);

// ── POST /api/jobs ──────────────────────────────────────────────────────────
// Step 1: upload files to GCS, create job in "preparing" state.
app.post("/api/jobs", async (c) => {
  const userId = c.get("userId");
  const formData = await c.req.formData();
  const mp3Files = formData.getAll("mp3").filter((f) => f instanceof File) as File[];
  const pdfFiles = formData.getAll("pdf").filter((f) => f instanceof File) as File[];
  const fach = formData.get("fach");
  const lectureName = formData.get("lectureName");

  if (
    mp3Files.length === 0 ||
    pdfFiles.length === 0 ||
    typeof fach !== "string" ||
    typeof lectureName !== "string"
  ) {
    return c.json({ error: "Missing required fields: mp3, pdf, fach, lectureName" }, 400);
  }

  const tempId = crypto.randomUUID();
  const stagingDir = await Deno.makeTempDir({ prefix: `job_upload_${tempId}_` });

  try {
    const mp3GcsPaths = await Promise.all(
      mp3Files.map(async (file, i) => {
        const localPath = Path.join(stagingDir, `mp3_${i}.mp3`);
        await Deno.writeFile(localPath, new Uint8Array(await file.arrayBuffer()));
        const gcsPath = `input/${userId}/jobs/${tempId}/raw/mp3_${i}.mp3`;
        await uploadFileToGcs(localPath, gcsPath);
        return gcsPath;
      }),
    );

    const pdfGcsPaths = await Promise.all(
      pdfFiles.map(async (file, i) => {
        const localPath = Path.join(stagingDir, `pdf_${i}.pdf`);
        await Deno.writeFile(localPath, new Uint8Array(await file.arrayBuffer()));
        const gcsPath = `input/${userId}/jobs/${tempId}/raw/pdf_${i}.pdf`;
        await uploadFileToGcs(localPath, gcsPath);
        return gcsPath;
      }),
    );

    const mp3OriginalNames = mp3Files.map((f) => f.name);
    const pdfOriginalNames = pdfFiles.map((f) => f.name);

    const fachDisplayNameRaw = formData.get("fachDisplayName");
    const fachDisplayName = typeof fachDisplayNameRaw === "string" && fachDisplayNameRaw.trim()
      ? fachDisplayNameRaw.trim()
      : undefined;

    const job = await createJob(userId, fach, lectureName, mp3GcsPaths, pdfGcsPaths, mp3OriginalNames, pdfOriginalNames, fachDisplayName);
    console.log(`Job ${job.id}: created in preparing state (${mp3GcsPaths.length} MP3, ${pdfGcsPaths.length} PDF)`);

    return c.json({ jobId: job.id }, 202);
  } finally {
    await Deno.remove(stagingDir, { recursive: true }).catch(() => {});
  }
});

// ── POST /api/jobs/:id/start ────────────────────────────────────────────────
// Step 2: trigger AI pipeline for an existing "preparing" or "failed" job.
app.post("/api/jobs/:id/start", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId")) return c.json({ error: "Forbidden" }, 403);
  if (job.status !== "preparing" && job.status !== "failed") {
    return c.json({ error: `Job is already in status: ${job.status}` }, 409);
  }

  await updateJob(job.id, { status: "processing", error: undefined });
  processUpload(job); // fire and forget — pipeline runs asynchronously

  console.log(`Job ${job.id}: pipeline started`);
  return c.json({ ok: true }, 202);
});

// ── GET /api/jobs ───────────────────────────────────────────────────────────
app.get("/api/jobs", async (c) => c.json(await listJobs(c.get("userId"))));

// ── GET /api/jobs/:id ───────────────────────────────────────────────────────
app.get("/api/jobs/:id", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId")) return c.json({ error: "Forbidden" }, 403);
  return c.json(job);
});

// ── GET /api/jobs/:id/intermediates ─────────────────────────────────────────
// Returns transcript (.txt) and stamped PDF from the for_dify/ GCS folder
// with short-lived signed download URLs.
app.get("/api/jobs/:id/intermediates", async (c) => {
  const job = await getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.userId !== c.get("userId")) return c.json({ error: "Forbidden" }, 403);

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

// ── PATCH /api/topics/:fach ─────────────────────────────────────────────────
// Update the display name for all jobs of a given fach.
app.patch("/api/topics/:fach", async (c) => {
  const userId = c.get("userId");
  const fach = c.req.param("fach");
  const body = await c.req.json<{ displayName?: string | null }>();
  const displayName = typeof body.displayName === "string" && body.displayName.trim()
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
  if (job.userId !== c.get("userId")) return c.json({ error: "Forbidden" }, 403);
  const key = c.req.param("key");
  const gcsPath = job.outputFiles[key];
  if (!gcsPath) return c.json({ error: "Output not found" }, 404);

  try {
    const text = await readTextFromGcs(gcsPath);
    return c.text(text, 200, { "Content-Type": "text/markdown; charset=utf-8" });
  } catch {
    return c.json({ error: "Failed to fetch from GCS" }, 500);
  }
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

  const job = await getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  const gcsPath = `output/${job.userId}/${job.fach}/${job.lectureName}/${baseName}`;
  const content = await c.req.text();
  await writeTextToGcs(gcsPath, content);

  // Key: strip "<fach>_<lectureName>_" prefix and ".md" suffix → "01-summary" etc.
  const typeKey = baseName.replace(/^[^_]+_[^_]+_/, "").replace(/\.md$/, "");

  // Transactional update — safe against concurrent webhook calls losing a file.
  const count = await addOutputFile(jobId, typeKey, gcsPath);
  if (count >= EXPECTED_OUTPUT_COUNT) {
    await setJobStatus(jobId, "processed");
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
