import { createTranscriptionFromParts } from "./util/openai.ts";
import { splitAudioWithOverlap } from "./util/mp3.ts";
import { clearTempFolder, createChunks, saveChunksWithTimestamps } from "./util/output.ts";

export async function transcribe(inputFilePath: string, outputFolder: string, tempDir: string) {
  const inputSplit = inputFilePath.split("/");
  const fileName = inputSplit.pop();

  const newFileName = fileName?.replace(".mp3", "_transcription.txt");
  const outputFilePath = `${outputFolder}/${newFileName}`;

  const outputFiles = await splitAudioWithOverlap(inputFilePath, tempDir);

  // promise all on transcription of each file
  const transcriptions = await createTranscriptionFromParts(outputFiles);

  // combine transcriptions and save to file
  const chunks = createChunks(transcriptions);

  saveChunksWithTimestamps(outputFilePath, chunks);
  // saveChunksWithoutTimestamps(outputFilePath + "_unstamped.txt", chunks);

  await clearTempFolder(outputFiles);

  console.log(`Transkription gespeichert in ${outputFilePath}`);
}
