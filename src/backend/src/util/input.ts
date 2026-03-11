import * as fs from "node:fs";
import Path from "node:path";

export function specificInput(): string {
  const inputFile = Deno.args[0];
  if (!inputFile) {
    console.error("Please provide an input file.");
    Deno.exit(1);
  }

  // check if file exists
  if (!fs.existsSync(inputFile)) {
    console.error("File does not exist.");
    Deno.exit(1);
  }
  return inputFile;
}

export function findFilesInInputDir(): string[] {
  const path = Path.join("src", "input");
  const files = fs.readdirSync(path);
  const mp3Files = files.filter((file) => file.endsWith(".mp3"));

  if (mp3Files.length === 0) {
    console.error("No mp3 files found in input directory.");
    Deno.exit(1);
  }

  return mp3Files;
}
