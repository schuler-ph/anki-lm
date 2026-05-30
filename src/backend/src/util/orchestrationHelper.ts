import { ensureDir, walk } from "@std/fs";
import Path from "node:path";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "./pdf.ts";
import { uploadToGcs } from "./storage.ts";

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export async function getFolders(folder: string): Promise<string[]> {
  const subfolders = [];
  for await (const entry of walk(folder, {
    includeDirs: true,
    includeFiles: false,
    maxDepth: 1,
  })) {
    if (entry.isDirectory && entry.path !== folder) {
      subfolders.push(entry.path);
    }
  }
  return subfolders.sort();
}

export async function getFilesInFolder(
  folder: string,
  extension?: string,
): Promise<string[]> {
  let files = [];
  for await (const entry of walk(folder, {
    includeDirs: false,
    includeFiles: true,
    maxDepth: 1,
  })) {
    if (entry.isFile) {
      files.push(entry.path);
    }
  }
  files = extension
    ? files.filter((file) => file.endsWith(`.${extension}`))
    : files;
  return files.sort();
}

export async function filesInFolderExist(folder: string) {
  await ensureDir(folder);
  for await (const entry of walk(folder, {
    includeDirs: false,
    includeFiles: true,
    maxDepth: 1,
  })) {
    if (entry.isFile) {
      return true;
    }
  }
  return false;
}

export async function prepareDifyFolder(folder: string) {
  const inputFolder = `${folder}/for_dify`;

  const mp3Files = await getFilesInFolder(folder, "mp3");
  for (const mp3File of mp3Files) {
    await transcribe(mp3File, inputFolder);
  }

  const pdfFiles = await getFilesInFolder(folder, "pdf");
  for (const pdfFile of pdfFiles) {
    const success = await stampPdfWithSlideNumber(pdfFile, inputFolder);
    if (!success) {
      console.warn(
        `PDF stamping failed for ${Path.basename(pdfFile)}, using original as fallback`,
      );
      const corruptedPath = Path.join(
        inputFolder,
        `${Path.basename(pdfFile, ".pdf")}_numbered.pdf`,
      );
      await Deno.remove(corruptedPath).catch(() => {});
      await Deno.copyFile(
        pdfFile,
        Path.join(inputFolder, Path.basename(pdfFile)),
      );
    }
  }
}

export async function sendDifyWorkflow(
  fileUrls: string[],
  fach: string,
  lectureName: string,
  outputPath: string,
): Promise<void> {
  const cfClientId = Deno.env.get("CF_ACCESS_CLIENT_ID");
  const cfClientSecret = Deno.env.get("CF_ACCESS_CLIENT_SECRET");
  const cfHeaders = cfClientId && cfClientSecret
    ? { "CF-Access-Client-Id": cfClientId, "CF-Access-Client-Secret": cfClientSecret }
    : {};

  const response = await fetch(
    `${requireEnv("DIFY_API_URL")}/v1/workflows/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("DIFY_API_KEY")}`,
        "Content-Type": "application/json",
        ...cfHeaders,
      },
      body: JSON.stringify({
        inputs: {
          fach,
          lectureName,
          output_path: outputPath,
          input_files: fileUrls.map((url) => ({
            transfer_method: "remote_url",
            url,
            type: "document",
          })),
        },
        response_mode: "streaming",
        user: "schuler-ph",
      }),
    },
  );

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    console.error("Failed to start Dify workflow:", response.statusText, errorBody);
    return;
  }

  // Drain the stream in the background so the connection is properly closed.
  // Outputs arrive via the webhook; we only log the run ID for correlation.
  (async () => {
    const stream = response.body!.pipeThrough(new TextDecoderStream());
    let buffer = "";
    for await (const chunk of stream) {
      buffer += chunk;
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(part.substring(6));
          if (parsed.event === "workflow_started") {
            console.log(`Dify workflow started. Run ID: ${parsed.workflow_run_id}`);
          } else if (parsed.event === "workflow_finished") {
            console.log(`Dify workflow finished. Status: ${parsed.data?.status}`);
          }
        } catch { /* ignore malformed chunks */ }
      }
    }
  })();
}

export async function sendDifyRequest(
  folder: string,
  fach: string,
  lectureName: string,
  outputPath: string,
): Promise<void> {
  const inputFolder = `${folder}/for_dify`;
  const files = await getFilesInFolder(inputFolder);
  console.log(`Sending Dify request for folder ${folder}...`);
  const fileUrls = await Promise.all(files.map(uploadToGcs));
  await sendDifyWorkflow(fileUrls, fach, lectureName, outputPath);
}
