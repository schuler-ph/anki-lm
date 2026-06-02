/**
 * One-time import script: migrates existing lectures from a local folder
 * (previously downloaded from Google Drive) into GCS + Firestore.
 *
 * Expected source structure:
 *   <source>/<fach>/lec/<lectureName>/
 *     lecture.mp3               ← raw input (optional)
 *     slides.pdf                ← raw input (optional)
 *     for_dify/
 *       lecture_transcription.txt
 *       slides_numbered.pdf
 *     from_dify/
 *       01-summary.md
 *       02-veredelt.md  ...
 *
 * Usage:
 *   cd src/backend
 *   deno run --allow-run --env-file --allow-env --allow-net --allow-read --allow-write \
 *     scripts/import-existing.ts \
 *     --source /path/to/local-lectures/ \
 *     --user-id <supabase-user-id> \
 *     [--dry-run]
 *
 * Get your Supabase user ID from the Supabase dashboard → Authentication → Users.
 */

import { walk, ensureDir } from "@std/fs";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import Path from "node:path";

// ── env ──────────────────────────────────────────────────────────────────────

function req(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

const GCS_BUCKET = req("GCS_BUCKET");
const GCP_PROJECT_ID = req("GCP_PROJECT_ID");
const GOOGLE_APPLICATION_CREDENTIALS = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS");

const storage = new Storage({ keyFilename: GOOGLE_APPLICATION_CREDENTIALS, projectId: GCP_PROJECT_ID });
const bucket = storage.bucket(GCS_BUCKET);
const db = new Firestore({ keyFilename: GOOGLE_APPLICATION_CREDENTIALS, projectId: GCP_PROJECT_ID, preferRest: true });

// ── args ─────────────────────────────────────────────────────────────────────

function parseArgs(): { source: string; userId: string; dryRun: boolean } {
  const args = Deno.args;
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const source = get("--source");
  const userId = get("--user-id");
  const dryRun = args.includes("--dry-run");
  if (!source || !userId) {
    console.error(
      "Usage: deno run ... import-existing.ts --source <dir> --user-id <uid> [--dry-run]",
    );
    Deno.exit(1);
  }
  return { source, userId, dryRun };
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of walk(dir, { maxDepth: 1, includeFiles: true, includeDirs: false })) {
      files.push(entry.path);
    }
  } catch { /* dir doesn't exist */ }
  return files.sort();
}

async function findFiles(dir: string, ext: string): Promise<string[]> {
  return (await listFiles(dir)).filter((f) => f.endsWith(ext));
}

async function upload(localPath: string, gcsPath: string): Promise<void> {
  await bucket.upload(localPath, { destination: gcsPath });
}

// Returns true if a job for (userId, fach, lectureName) already exists in Firestore.
async function jobExists(userId: string, fach: string, lectureName: string): Promise<boolean> {
  const snap = await db.collection("jobs")
    .where("userId", "==", userId)
    .where("fach", "==", fach)
    .where("lectureName", "==", lectureName)
    .limit(1)
    .get();
  return !snap.empty;
}

// Strips leading YYYY-MM-DD_ date prefix from folder names.
function extractLectureName(basename: string): string {
  return basename.replace(/^\d{4}-\d{2}-\d{2}_?/, "") || basename;
}

// ── main ──────────────────────────────────────────────────────────────────────

const { source, userId, dryRun } = parseArgs();
if (dryRun) console.log("DRY RUN — no files will be uploaded or written.\n");

let imported = 0;
let skipped = 0;
let errors = 0;

for await (const fachEntry of walk(source, { maxDepth: 1, includeDirs: true, includeFiles: false })) {
  if (fachEntry.path === source) continue;

  const fach = Path.basename(fachEntry.path).toLowerCase();
  const lecPath = Path.join(fachEntry.path, "lec");

  let lecEntries: { path: string }[];
  try {
    lecEntries = [];
    for await (const e of walk(lecPath, { maxDepth: 1, includeDirs: true, includeFiles: false })) {
      lecEntries.push(e);
    }
  } catch {
    continue;
  }
  for (const lecEntry of lecEntries) {
    if (lecEntry.path === lecPath) continue;

    const folderBasename = Path.basename(lecEntry.path);
    const lectureName = extractLectureName(folderBasename);

    // ── check for duplicates ──
    if (!dryRun && await jobExists(userId, fach, lectureName)) {
      console.log(`SKIP  ${fach}/${folderBasename} — already in Firestore`);
      skipped++;
      continue;
    }

    const rawDir = lecEntry.path;
    const forDifyDir = Path.join(rawDir, "for_dify");
    const fromDifyDir = Path.join(rawDir, "from_dify");

    const rawMp3s = await findFiles(rawDir, ".mp3");
    const rawPdfs = await findFiles(rawDir, ".pdf");
    const forDifyFiles = await listFiles(forDifyDir);
    const fromDifyFiles = (await listFiles(fromDifyDir)).filter((f) => f.endsWith(".md"));

    if (rawMp3s.length === 0 && rawPdfs.length === 0) {
      console.log(`SKIP  ${fach}/${folderBasename} — no raw MP3 or PDF found`);
      skipped++;
      continue;
    }

    const status = fromDifyFiles.length > 0 ? "processed" : "preparing";
    const jobId = crypto.randomUUID();

    console.log(
      `${dryRun ? "DRY " : ""}IMPORT  ${fach}/${folderBasename}  →  job ${jobId}  (${status}, ${fromDifyFiles.length} outputs)`,
    );

    if (dryRun) {
      console.log(`  raw: ${rawMp3s.length} mp3, ${rawPdfs.length} pdf`);
      console.log(`  for_dify: ${forDifyFiles.length} files`);
      console.log(`  from_dify: ${fromDifyFiles.map((f) => Path.basename(f)).join(", ") || "none"}`);
      continue;
    }

    try {
      const mp3GcsPaths: string[] = [];
      const pdfGcsPaths: string[] = [];
      const outputFiles: Record<string, string> = {};

      // Upload raw MP3s
      for (const f of rawMp3s) {
        const gcsPath = `input/${userId}/jobs/${jobId}/raw/${Path.basename(f)}`;
        await upload(f, gcsPath);
        mp3GcsPaths.push(gcsPath);
      }

      // Upload raw PDFs
      for (const f of rawPdfs) {
        const gcsPath = `input/${userId}/jobs/${jobId}/raw/${Path.basename(f)}`;
        await upload(f, gcsPath);
        pdfGcsPaths.push(gcsPath);
      }

      // Upload for_dify intermediates
      for (const f of forDifyFiles) {
        const gcsPath = `input/${userId}/jobs/${jobId}/for_dify/${Path.basename(f)}`;
        await upload(f, gcsPath);
      }

      // Upload from_dify outputs — add fach_lectureName_ prefix to match webhook convention
      for (const f of fromDifyFiles) {
        const base = Path.basename(f);                           // "01-summary.md"
        const typeKey = base.replace(/\.md$/, "");               // "01-summary"
        const gcsBase = `${fach}_${lectureName}_${base}`;        // "eai_ArchitekturMuster_01-summary.md"
        const gcsPath = `output/${userId}/${fach}/${lectureName}/${gcsBase}`;
        await upload(f, gcsPath);
        outputFiles[typeKey] = gcsPath;
      }

      // Write Firestore job record
      const job: Record<string, unknown> = {
        id: jobId,
        userId,
        fach,
        lectureName,
        status,
        outputFiles,
        createdAt: Date.now(),
        mp3GcsPaths,
        pdfGcsPaths,
        mp3OriginalNames: rawMp3s.map((f) => Path.basename(f)),
        pdfOriginalNames: rawPdfs.map((f) => Path.basename(f)),
      };
      await db.collection("jobs").doc(jobId).set(job);

      console.log(`  ✓  ${Object.keys(outputFiles).length} output files stored`);
      imported++;
    } catch (err) {
      console.error(`  ✗  ${fach}/${folderBasename}: ${err}`);
      errors++;
    }
  }
}

console.log(`\nDone. ${imported} imported, ${skipped} skipped, ${errors} errors.${dryRun ? " (dry run)" : ""}`);
