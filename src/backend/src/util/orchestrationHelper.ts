import { ensureDir, walk } from "@std/fs";
import { transcribe } from "../transcribe.ts";
import { stampPdfWithSlideNumber } from "./pdf.ts";
import { toFileServerPath, toRelativeLecturePath } from "./storageRoot.ts";

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8019/", {
      method: "GET",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getFolders(folder: string): Promise<string[]> {
  const subfolders = [];
  for await (
    const entry of walk(folder, {
      includeDirs: true,
      includeFiles: false,
      maxDepth: 1,
    })
  ) {
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
  for await (
    const entry of walk(folder, {
      includeDirs: false,
      includeFiles: true,
      maxDepth: 1,
    })
  ) {
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
  for await (
    const entry of walk(folder, {
      includeDirs: false,
      includeFiles: true,
      maxDepth: 1,
    })
  ) {
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
    await stampPdfWithSlideNumber(pdfFile, inputFolder);
  }
}

export async function sendDifyRequest(folder: string, fach: string) {
  const inputFolder = `${folder}/for_dify`;
  const outputFolder = `${folder}/from_dify`;

  const files = await getFilesInFolder(inputFolder);
  console.log(files);

  console.log(`Sending Dify request for folder ${folder}...`);

  const response = await fetch(`http://localhost:8099/v1/workflows/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("DIFY_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {
        fach,
        input_files: files.map((filePath) => ({
          transfer_method: "remote_url",
          url: `http://host.docker.internal:8019/${toFileServerPath(filePath)}`,
          type: "document",
        })),
        output_path: toRelativeLecturePath(outputFolder),
      },
      response_mode: "streaming",
      user: "schuler-ph",
    }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    console.error("Failed to fetch stream:", response.statusText, errorBody);
    return;
  }

  // Convert the byte stream to a text stream
  const stream = response.body.pipeThrough(new TextDecoderStream());

  let buffer = "";
  let fullTextOutput = "";

  // Asynchronously iterate over each chunk of text from the stream
  for await (const chunk of stream) {
    buffer += chunk;
    const parts = buffer.split("\n\n");

    // The last part may be incomplete, so keep it in the buffer
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.startsWith("data: ")) continue;

      const jsonData = part.substring(6); // Remove "data: "
      if (!jsonData) continue;

      try {
        const parsedData = JSON.parse(jsonData);

        // Process the event based on its type
        switch (parsedData.event) {
          case "workflow_started":
            console.log(
              `Workflow started. Run ID: ${parsedData.workflow_run_id}`,
            );
            break;
          case "node_started":
            console.log(`[Node Started] > ${parsedData.data.title}`);
            break;
          case "text_chunk":
            // Append the generated text to our variable
            fullTextOutput += parsedData.data.text;
            break;
          case "node_finished":
            console.log(
              `[Node Finished] > ${parsedData.data.title} | Status: ${parsedData.data.status}`,
            );
            break;
          case "workflow_finished":
            console.log(
              `\nWorkflow finished. Status: ${parsedData.data.status}`,
            );
            // The full response is now available
            console.log("--- Final Generated Text ---");
            console.log(fullTextOutput);
            // Now you can save `fullTextOutput` to a file in `outputFolder`
            // For example:
            // const outputPath = `${outputFolder}/result.txt`;
            // await Deno.writeTextFile(outputPath, fullTextOutput);
            // console.log(`Output saved to ${outputPath}`);
            break;
          case "ping":
            // A keep-alive event, can be ignored.
            break;
          default:
            // In case Dify adds new event types
            console.log(`Received unhandled event: ${parsedData.event}`);
        }
      } catch (error) {
        console.error("Failed to parse JSON from stream chunk:", error);
        console.error("Original data part:", jsonData);
      }
    }
  }

  // This part handles any leftover data in the buffer after the stream closes.
  // In a well-formed stream, this might not be necessary, but it's good practice.
  if (buffer.trim().startsWith("data:")) {
    console.warn("Handling leftover buffer data:", buffer);
    // You could add final parsing logic here if needed.
  }
}
