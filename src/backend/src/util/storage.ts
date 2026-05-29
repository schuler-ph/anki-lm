import { Storage } from "@google-cloud/storage";
import { toRelativeLecturePath } from "./storageRoot.ts";

function getStorage(): Storage {
  return new Storage({
    keyFilename: Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS"),
    projectId: Deno.env.get("GCP_PROJECT_ID"),
  });
}

function getBucket(storage: Storage): ReturnType<Storage["bucket"]> {
  const bucket = Deno.env.get("GCS_BUCKET");
  if (!bucket) throw new Error("GCS_BUCKET not set");
  return storage.bucket(bucket);
}

async function signedUrl(
  storage: Storage,
  gcsPath: string,
): Promise<string> {
  const bucket = getBucket(storage);
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });
  return url;
}

// Uploads a local file to GCS under input/<relative lecture path>.
// Requires LECTURE_ROOT to be set (used by the orchestrator).
export async function uploadToGcs(localPath: string): Promise<string> {
  const storage = getStorage();
  const gcsPath = `input/${toRelativeLecturePath(localPath)}`;
  await getBucket(storage).upload(localPath, { destination: gcsPath });
  return signedUrl(storage, gcsPath);
}

// Uploads a local file to an explicit GCS destination path.
export async function uploadFileToGcs(
  localPath: string,
  gcsPath: string,
): Promise<string> {
  const storage = getStorage();
  await getBucket(storage).upload(localPath, { destination: gcsPath });
  return signedUrl(storage, gcsPath);
}

// Writes text content directly to GCS and returns a signed read URL.
export async function writeTextToGcs(
  gcsPath: string,
  text: string,
): Promise<string> {
  const storage = getStorage();
  await getBucket(storage).file(gcsPath).save(text, {
    contentType: "text/markdown; charset=utf-8",
  });
  return signedUrl(storage, gcsPath);
}
