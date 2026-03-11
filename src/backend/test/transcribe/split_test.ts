import Path from "node:path";
import { getAudioDuration, splitAudioWithOverlap } from "../../src/util/mp3.ts";
import { assertAlmostEquals, assertEquals } from "@std/assert";
import { SPLIT_AUDIO_DURATION } from "../../src/types/constants/splitting.ts";

Deno.test(async function ffprobeDurationTest() {
  const path = Path.join("test", "resources", "mp3", "teil_000.mp3");
  const duration = await getAudioDuration(path);
  assertAlmostEquals(duration, SPLIT_AUDIO_DURATION, 1);
});

Deno.test(async function splitAudioWithOverlapTest() {
  const path = Path.join("test", "resources", "mp3", "vo1.mp3");
  const outPath = Path.join("test", "temp", "test_output");

  const outputFiles = await splitAudioWithOverlap(path, outPath);

  assertEquals(outputFiles.length, 11);

  for (const file of outputFiles) {
    const duration = await getAudioDuration(file);

    // except the last file, all should be approximately SPLIT_AUDIO_DURATION
    if (file === outputFiles[10]) {
      continue;
    }
    assertAlmostEquals(duration, SPLIT_AUDIO_DURATION, 1);
  }

  // Aufräumen
  for (const file of outputFiles) {
    await Deno.remove(file);
  }
});
