import {
  configure,
  TextReader,
  Uint8ArrayReader,
  ZipWriter,
} from "@zip-js/zip-js";

// Deno has no Web Worker pool wired up for zip.js by default — run compression inline.
configure({ useWebWorkers: false });

export interface ZipEntry {
  /** Path of the file inside the archive, e.g. "EAI/ArchitekturMuster/EAI_..._summary.md". */
  name: string;
  /** Lazily opens the entry's data — called only when the file is written into the zip. */
  open: () => Promise<TextReader | Uint8ArrayReader>;
}

// Builds a ZIP archive as a streaming ReadableStream: each entry is loaded and compressed
// just before it is written, so peak memory stays bounded by the largest single file
// rather than the whole archive. The returned stream can be handed straight to a Response.
export function createZipStream(entries: ZipEntry[]): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

  (async () => {
    const zip = new ZipWriter(writable);
    for (const entry of entries) {
      await zip.add(entry.name, await entry.open());
    }
    await zip.close();
  })().catch(async (err) => {
    console.error("ZIP stream failed:", err);
    try {
      await writable.abort(err);
    } catch {
      // stream already closing — nothing to do
    }
  });

  return readable;
}

export { TextReader, Uint8ArrayReader };
