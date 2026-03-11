import Path from "node:path";
import * as fs from "node:fs";
import { TranscriptionVerbose } from "openaiAudio";
import {
  SPLIT_AUDIO_DURATION,
  SPLIT_AUDIO_OVERLAP,
} from "../types/constants/splitting.ts";
import { getFilesInFolder } from "./orchestrationHelper.ts";

interface TextChunk {
  timestamp: string;
  text: string;
}

export function createChunks(transcriptions: (TranscriptionVerbose & {
  _request_id?: string | null;
})[]): TextChunk[] {
  const processedSegments: TextChunk[] = [];
  let lastEndTime = 0;

  // Der 'stepSize' ist der tatsächliche Fortschritt im Audio für jeden neuen Chunk.
  // Wenn ein Chunk 600s lang ist mit 60s Überlappung, bringt uns jeder neue Chunk
  // nur 540s im Originalaudio voran.
  const stepSize = SPLIT_AUDIO_DURATION - SPLIT_AUDIO_OVERLAP;

  // Iteriere durch jeden Transkriptions-Chunk und seinen Index 'i'.
  transcriptions.forEach((transcription, i) => {
    if (!transcription.segments || transcription.segments.length === 0) {
      return;
    }

    // Dies ist der entscheidende Punkt, den Sie angesprochen haben.
    // Wir berechnen die absolute Startzeit des aktuellen Chunks 'i' im Originalaudio.
    // Diese ist i * stepSize.
    const chunkStartTime = i * stepSize;

    // Iteriere durch die Segmente innerhalb des aktuellen Chunks.
    for (const segment of transcription.segments) {
      // Berechne die absoluten Start- und Endzeiten für das Segment,
      // indem der Offset des Chunks (chunkStartTime) zur relativen Zeit des Segments addiert wird.
      const startSecondsTotal = chunkStartTime + segment.start;
      const endSecondsTotal = chunkStartTime + segment.end;

      // Logik zur Deduplizierung:
      // Wir fügen ein Segment nur hinzu, wenn seine absolute Startzeit nach (oder gleich)
      // der Endzeit des letzten hinzugefügten Segments liegt.
      // Dies verhindert, dass Text aus den überlappenden Bereichen doppelt erscheint.
      if (startSecondsTotal >= lastEndTime) {
        // Formatieren der Zeitstempel für die Ausgabe.
        const startMinutes = Math.floor(startSecondsTotal / 60);
        const startSeconds = Math.floor(startSecondsTotal % 60);
        const endMinutes = Math.floor(endSecondsTotal / 60);
        const endSeconds = Math.floor(endSecondsTotal % 60);

        const startTime = `${startMinutes}:${
          startSeconds
            .toString()
            .padStart(2, "0")
        }`;
        const endTime = `${endMinutes}:${
          endSeconds
            .toString()
            .padStart(2, "0")
        }`;

        const timestamp = `[${startTime} - ${endTime}]`;
        const textChunk = { timestamp, text: segment.text.trim() };

        processedSegments.push(textChunk);

        // Aktualisiere die Endzeit des zuletzt verarbeiteten Segments.
        lastEndTime = endSecondsTotal;
      }
    }
  });

  return processedSegments;
}

export function overwriteToDisk(filePath: string, content: string) {
  fs.mkdirSync(Path.dirname(filePath), { recursive: true });
  fs.rmSync(filePath, { force: true });
  fs.writeFileSync(filePath, content);
}

export async function clearTempFolder(outputFiles: string[]) {
  for (const file of outputFiles) {
    await Deno.remove(file);
  }
}

export async function resetTempFolder() {
  const files = await getFilesInFolder("summarize/src/temp");
  await clearTempFolder(files);
}

export function saveChunksWithTimestamps(
  filePath: string,
  chunks: TextChunk[],
) {
  const content = chunks.map((chunk) => `${chunk.timestamp} ${chunk.text}`)
    .join("\n");
  overwriteToDisk(filePath, content);
}

export function saveChunksWithoutTimestamps(
  filePath: string,
  chunks: TextChunk[],
) {
  const content = chunks.map((chunk) => chunk.text).join("\n");
  overwriteToDisk(filePath, content);
}
