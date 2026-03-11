import OpenAI from "@openai/openai";
// import { pLimit } from "https://deno.land/x/p_limit@v1.0.0/mod.ts";
import { basename } from "node:path";

const lang = "en"; // "de" or undefined for auto-detect "en" https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
// const limit = pLimit(Infinity);
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export const client = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
  timeout: 120_000,
  fetch: (input, init = {}) => {
    const headers = init.headers instanceof Headers
      ? init.headers
      : new Headers(init.headers);
    headers.set("Connection", "close");
    headers.set("Cache-Control", "no-store");
    return fetch(input, { ...init, headers });
  },
});

async function fileToDenoBlob(filePath: string): Promise<File> {
  const data = await Deno.readFile(filePath);
  // best-effort mime
  const type = filePath.endsWith(".mp3")
    ? "audio/mpeg"
    : "application/octet-stream";
  return new File([data], basename(filePath), { type });
}

async function transcribePartWithRetry(
  filePath: string,
  attempt = 1,
  idx?: number,
  total?: number,
) {
  try {
    const file = await fileToDenoBlob(filePath);
    return await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      prompt:
        "You will transcribe a lecture recording from the Technical University of Vienna. TU Wien Begriffe: TISS (TU Wien Informations-Systeme & Services), TUWEL (TU Wien E-Learning)",
      ...(lang ? { language: lang } : {}),
    });
  } catch (e: unknown) {
    if (
      attempt < MAX_RETRIES
    ) {
      console.warn(
        `Retry ${attempt}/${MAX_RETRIES} for "${basename(filePath)}"${
          idx !== undefined ? ` (File ${idx + 1}/${total})` : ""
        }`,
      );
      const wait = RETRY_BASE_MS * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, wait));
      return transcribePartWithRetry(filePath, attempt + 1, idx, total);
    }
    throw e;
  }
}

export async function createTranscriptionFromParts(
  files: string[],
) {
  let successCount = 0;
  const total = files.length;

  const jobs = files.map(async (filePath, idx) => {
    console.log(`Start (${idx + 1}/${total}): ${basename(filePath)}`);
    const res = await transcribePartWithRetry(filePath, 1, idx, total);
    successCount++;
    console.log(`Done (${successCount}/${total}): ${basename(filePath)}`);
    return res;
  });

  return await Promise.all(jobs);
}
