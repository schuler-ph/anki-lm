import {
  SPLIT_AUDIO_DURATION,
  SPLIT_AUDIO_OVERLAP,
} from "../types/constants/splitting.ts";
import Path from "node:path";

export async function getAudioDuration(inputFile: string): Promise<number> {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      inputFile,
    ],
    stdout: "piped", // capture
    stderr: "null", // silence
  });

  const { stdout } = await command.output();
  const durationStr = new TextDecoder().decode(stdout).trim();
  return parseFloat(durationStr);
}

export async function splitAudioWithOverlap(
  inputFile: string,
): Promise<string[]> {
  const outputPrefix = Path.join("summarize", "src", "temp", "chunk");
  const totalDuration = await getAudioDuration(inputFile);
  if (isNaN(totalDuration)) {
    throw new Error("Konnte die Gesamtdauer der Audiodatei nicht ermitteln.");
  }

  const stepSize = SPLIT_AUDIO_DURATION - SPLIT_AUDIO_OVERLAP;
  let startTime = 0;
  let segmentIndex = 1;

  const segments = [];

  while (startTime < totalDuration) {
    const outputFileName = `${outputPrefix}_${
      segmentIndex.toString().padStart(3, "0")
    }.mp3`;
    const segmentEndTime = Math.min(
      startTime + SPLIT_AUDIO_DURATION,
      totalDuration,
    );

    segments.push({
      start: startTime,
      end: segmentEndTime,
      file: outputFileName,
    });

    startTime += stepSize;
    if (
      startTime + SPLIT_AUDIO_DURATION > totalDuration &&
      totalDuration - startTime < SPLIT_AUDIO_OVERLAP
    ) {
      break;
    }
    segmentIndex++;
  }

  const promises = segments.map(async (segment) => {
    const ffmpegCommand = new Deno.Command("ffmpeg", {
      args: [
        "-i",
        inputFile,
        "-ss",
        segment.start.toString(),
        "-to",
        segment.end.toString(),
        "-c",
        "copy",
        segment.file,
      ],
      stdout: "null", // silence
      stderr: "null", // silence (ffmpeg logs progress here)
    });

    const status = await ffmpegCommand.spawn().status;

    if (!status.success) {
      throw new Error(`Fehler beim Erstellen von Segment ${segmentIndex}.`);
    }
  });

  await Promise.all(promises);

  return segments.map((s) => s.file);
}
