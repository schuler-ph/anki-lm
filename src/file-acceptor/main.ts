/**
 * Cloud Run file-acceptor service.
 * Replaces the local fileAcceptor.ts — same HTTP API, but backed by GCS.
 *
 * POST /?fileName=<relative-path>  — writes request body as text to GCS
 * GET  /<relative-path>            — streams GCS object to response
 * GET  /                           — health check
 *
 * Auth: requests must include header  Authorization: Bearer <FILE_ACCEPTOR_SECRET>
 * (Dify sets this via the HTTP-Request node headers field)
 */

import { Storage } from "npm:@google-cloud/storage@7";

const PORT = parseInt(Deno.env.get("PORT") ?? "8080");
const BUCKET_NAME = Deno.env.get("GCS_BUCKET") ?? "";
const SECRET = Deno.env.get("FILE_ACCEPTOR_SECRET") ?? "";

if (!BUCKET_NAME) throw new Error("GCS_BUCKET env var is required");
if (!SECRET) throw new Error("FILE_ACCEPTOR_SECRET env var is required");

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return auth === `Bearer ${SECRET}`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    return new Response(`file-acceptor running, bucket: ${BUCKET_NAME}`, { status: 200 });
  }

  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (req.method === "POST") {
    const fileName = url.searchParams.get("fileName");
    if (!fileName) {
      return new Response('"fileName" query parameter is required', { status: 400 });
    }
    // Sanitize: strip leading slash, prevent path traversal
    const objectPath = fileName.replace(/^\/+/, "").replace(/\.\.\//g, "");
    const content = await req.text();
    await bucket.file(objectPath).save(content, { contentType: "text/plain; charset=utf-8" });
    return new Response(`Saved to gs://${BUCKET_NAME}/${objectPath}`, { status: 200 });
  }

  if (req.method === "GET") {
    const objectPath = url.pathname.replace(/^\/+/, "").replace(/\.\.\//g, "");
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) return new Response("Not Found", { status: 404 });

    const [content] = await file.download();
    return new Response(content.toString("utf-8"), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

Deno.serve({ port: PORT }, handler);
console.log(`file-acceptor running on :${PORT}, bucket: ${BUCKET_NAME}`);
