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

async function signedUrl(storage: Storage, gcsPath: string): Promise<string> {
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

// Downloads a GCS object into memory and returns it as a UTF-8 string.
export async function readTextFromGcs(gcsPath: string): Promise<string> {
  const storage = getStorage();
  const [content] = await getBucket(storage).file(gcsPath).download();
  return content.toString("utf-8");
}

// Downloads a GCS object into memory and returns it as raw bytes (for binary files).
export async function readBytesFromGcs(gcsPath: string): Promise<Uint8Array> {
  const storage = getStorage();
  const [content] = await getBucket(storage).file(gcsPath).download();
  return new Uint8Array(content);
}

// Downloads a GCS object to a local file path.
export async function downloadFromGcs(
  gcsPath: string,
  localPath: string,
): Promise<void> {
  const storage = getStorage();
  await getBucket(storage).file(gcsPath).download({ destination: localPath });
}

// Lists all GCS object paths under a prefix.
export async function listGcsFiles(prefix: string): Promise<string[]> {
  const storage = getStorage();
  const [files] = await getBucket(storage).getFiles({ prefix });
  return files.map((f) => f.name);
}

// Returns a signed read URL for an existing GCS object.
export function getSignedUrl(gcsPath: string): Promise<string> {
  return signedUrl(getStorage(), gcsPath);
}

// Returns a signed PUT URL so the browser can upload directly to GCS,
// bypassing the Cloud Run 32 MB request-body limit.
export async function getSignedUploadUrl(
  gcsPath: string,
  contentType: string,
): Promise<string> {
  const storage = getStorage();
  const bucket = getBucket(storage);
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    version: "v4",
    action: "write",
    contentType,
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
}
