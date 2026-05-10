import {
  checkHealth,
  filesInFolderExist,
  getFolders,
  prepareDifyFolder,
  sendDifyRequest,
} from "./util/orchestrationHelper.ts";
import { resolveLecturePath } from "./util/storageRoot.ts";
import Path from "node:path";

await checkHealth();

const faecher = ["eai", "lar", "iid"];

type FolderTask = { folder: string; fach: string; needsPrep: boolean };

const tasks: FolderTask[] = [];

for (const fach of faecher) {
  const lecPath = resolveLecturePath(`${fach}/lec`);
  const folders = await getFolders(lecPath);

  for (const folder of folders) {
    const isPrepared = await filesInFolderExist(`${folder}/for_dify`);
    const isProcessed = await filesInFolderExist(`${folder}/from_dify`);

    if (isProcessed) continue;
    tasks.push({ folder, fach, needsPrep: !isPrepared });
  }
}

if (tasks.length === 0) {
  console.log("All folders already processed.");
} else {
  const toPrep = tasks.filter((t) => t.needsPrep).map((t) =>
    Path.basename(t.folder)
  );
  const toProcess = tasks.map((t) => Path.basename(t.folder));

  if (toPrep.length > 0) {
    console.log(
      `Preparing folders (${toPrep.join(", ")}) and processing (${toProcess.join(", ")})`,
    );
  } else {
    console.log(`Processing folders (${toProcess.join(", ")})`);
  }
}

for (const { folder, fach, needsPrep } of tasks) {
  console.log(`Starting with folder ${Path.basename(folder)}`);
  if (needsPrep) {
    await prepareDifyFolder(folder);
  }
  await sendDifyRequest(folder, fach);
}

console.log("Done.");
