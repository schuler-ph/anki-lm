// server.ts
import { ensureDir } from "@std/fs";
import { serveDir } from "@std/http/file-server";
import { dirname } from "@std/path";
import { getLectureRoot, resolveLecturePath } from "./util/storageRoot.ts";

const headers = { "Content-Type": "text/plain" };
const lectureRoot = getLectureRoot();

/**
 * Handles incoming HTTP requests.
 * - POST requests are used to write a file to disk.
 * - GET requests serve files from the 'data/03-out/' directory.
 *
 * @param req The incoming HTTP request.
 * @returns A Response object.
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  console.log("Received request:", req.method, url.pathname);

  if (req.method === "GET") {
    // If the request is for the root, you might want to return a status message.
    if (url.pathname === "/") {
      return new Response(
        "File server is running. Access files by their path.",
        {
          status: 200,
          headers,
        },
      );
    }

    return serveDir(req, { fsRoot: lectureRoot });
  }

  // Handle POST requests to write files.
  if (req.method === "POST") {
    try {
      const fileName = url.searchParams.get("fileName");

      // Validate that the fileName is present.
      if (!fileName || typeof fileName !== "string") {
        return new Response(
          'Invalid request. "fileName" query parameter is required.',
          { status: 400, headers },
        );
      }

      // Read the entire body of the request as text.
      const fileContent = await req.text();

      const outputFilePath = resolveLecturePath(fileName);
      await ensureDir(dirname(outputFilePath));
      await Deno.writeTextFile(outputFilePath, fileContent);

      // Return a success response.
      return new Response(
        `File "${outputFilePath}" was written successfully.`,
        {
          status: 200,
          headers,
        },
      );
    } catch (error: unknown) {
      // Handle potential errors, such as file system issues.
      console.error(error);
      return new Response(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { status: 500, headers },
      );
    }
  }

  // If the method is not GET or POST, return an error.
  return new Response("Invalid request method. Please use POST or GET.", {
    status: 405,
    headers,
  });
}

// Start the Deno HTTP server on port 8019.
Deno.serve({ port: 8019 }, handler);

console.log(`Server running on http://localhost:8019/ for ${lectureRoot}`);
