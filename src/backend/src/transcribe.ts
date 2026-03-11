import { createTranscriptionFromParts } from "./util/openai.ts";
import { splitAudioWithOverlap } from "./util/mp3.ts";
import {
  clearTempFolder,
  createChunks,
  resetTempFolder,
  saveChunksWithTimestamps,
} from "./util/output.ts";

export async function transcribe(inputFilePath: string, outputFolder: string) {
  await resetTempFolder();

  const inputSplit = inputFilePath.split("/");
  const fileName = inputSplit.pop();

  const newFileName = fileName?.replace(".mp3", "_transcription.txt");
  const outputFilePath = `${outputFolder}/${newFileName}`;

  // split it into 500 second chunks with 5 second overlap and return the new file names
  const outputFiles = await splitAudioWithOverlap(inputFilePath);

  // promise all on transcription of each file
  const transcriptions = await createTranscriptionFromParts(outputFiles);

  // combine transcriptions and save to file
  const chunks = createChunks(transcriptions);

  saveChunksWithTimestamps(outputFilePath, chunks);
  // saveChunksWithoutTimestamps(outputFilePath + "_unstamped.txt", chunks);

  await clearTempFolder(outputFiles);

  console.log(`Transkription gespeichert in ${outputFilePath}`);
}
