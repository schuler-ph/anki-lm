import { Storage } from "@google-cloud/storage";
import { toRelativeLecturePath } from "./storageRoot.ts";

function getStorage(): Storage {
  return new Storage({
    keyFilename: Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS"),
    projectId: Deno.env.get("GCP_PROJECT_ID"),
  });
}

// Uploads localPath to GCS under input/<relativeLecturePath>.
// Returns a V4 signed URL valid for 1 hour (Dify fetch window).
export async function uploadToGcs(localPath: string): Promise<string> {
  const bucket = Deno.env.get("GCS_BUCKET");
  if (!bucket) throw new Error("GCS_BUCKET not set");

  const gcsPath = `input/${toRelativeLecturePath(localPath)}`;
  const storage = getStorage();
  await storage.bucket(bucket).upload(localPath, { destination: gcsPath });

  const [url] = await storage.bucket(bucket).file(gcsPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });
  return url;
}
