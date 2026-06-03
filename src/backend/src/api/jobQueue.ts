import { FieldValue, Firestore } from "@google-cloud/firestore";
import type { Job, JobStatus } from "./types.ts";

const COLLECTION = "jobs";

let _db: Firestore | undefined;
function db(): Firestore {
  if (!_db) {
    _db = new Firestore({
      keyFilename: Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS"),
      projectId: Deno.env.get("GCP_PROJECT_ID"),
      preferRest: true,
    });
  }
  return _db;
}

function toJob(id: string, data: FirebaseFirestore.DocumentData): Job {
  return {
    id,
    userId: data.userId as string,
    fach: data.fach as string,
    lectureName: data.lectureName as string,
    status: data.status as JobStatus,
    outputFiles: (data.outputFiles ?? {}) as Record<string, string>,
    createdAt: data.createdAt as number,
    // Backward compat: old docs have singular mp3GcsPath/pdfGcsPath
    mp3GcsPaths: (data.mp3GcsPaths ??
      (data.mp3GcsPath ? [data.mp3GcsPath] : [])) as string[],
    pdfGcsPaths: (data.pdfGcsPaths ??
      (data.pdfGcsPath ? [data.pdfGcsPath] : [])) as string[],
    mp3OriginalNames: (data.mp3OriginalNames ?? []) as string[],
    pdfOriginalNames: (data.pdfOriginalNames ?? []) as string[],
    fachDisplayName: data.fachDisplayName as string | undefined,
    error: data.error as string | undefined,
  };
}

export async function createJob(
  userId: string,
  fach: string,
  lectureName: string,
  mp3GcsPaths: string[],
  pdfGcsPaths: string[],
  mp3OriginalNames: string[],
  pdfOriginalNames: string[],
  fachDisplayName?: string,
  id?: string,
): Promise<Job> {
  const job: Job = {
    id: id ?? crypto.randomUUID(),
    userId,
    fach,
    lectureName,
    status: "preparing",
    outputFiles: {},
    createdAt: Date.now(),
    mp3GcsPaths,
    pdfGcsPaths,
    mp3OriginalNames,
    pdfOriginalNames,
    ...(fachDisplayName !== undefined && { fachDisplayName }),
  };
  await db().collection(COLLECTION).doc(job.id).set(job);
  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const doc = await db().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return undefined;
  return toJob(doc.id, doc.data()!);
}

export async function listJobs(userId: string): Promise<Job[]> {
  const snapshot = await db()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();
  return snapshot.docs
    .map((d) => toJob(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateJob(
  id: string,
  patch: Partial<Job>,
): Promise<void> {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    update[k] = v === undefined ? FieldValue.delete() : v;
  }
  await db().collection(COLLECTION).doc(id).update(update);
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  error?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (error !== undefined) patch.error = error;
  await db().collection(COLLECTION).doc(id).update(patch);
}

export async function setFachDisplayName(
  userId: string,
  fach: string,
  displayName: string | undefined,
): Promise<void> {
  const snapshot = await db()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("fach", "==", fach)
    .get();
  if (snapshot.empty) return;
  const batch = db().batch();
  for (const doc of snapshot.docs) {
    batch.update(doc.ref, {
      fachDisplayName:
        displayName !== undefined ? displayName : FieldValue.delete(),
    });
  }
  await batch.commit();
}

// Transactional read-modify-write — safe against concurrent webhook calls.
// Returns the new total count of stored output files.
export async function addOutputFile(
  id: string,
  key: string,
  url: string,
): Promise<number> {
  const ref = db().collection(COLLECTION).doc(id);
  return db().runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return 0;
    const current = (doc.data()?.outputFiles ?? {}) as Record<string, string>;
    const updated = { ...current, [key]: url };
    t.update(ref, { outputFiles: updated });
    return Object.keys(updated).length;
  });
}
