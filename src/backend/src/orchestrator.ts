import {
  checkHealth,
  filesInFolderExist,
  getFolders,
  prepareDifyFolder,
  sendDifyRequest,
} from "./util/orchestrationHelper.ts";
import { resolveLecturePath } from "./util/storageRoot.ts";

await checkHealth();

const faecher = ["eai", "lar", "iid"];

const skippedPrep = [];
const skippedProcess = [];

for (const fach of faecher) {
  console.log("Starting orchestration for fach: " + fach);
  const folder = resolveLecturePath(`${fach}/lec`);

  const folders = await getFolders(folder);

  for (const folder of folders) {
    if (await filesInFolderExist(folder + "/for_dify")) {
      console.log(folder + " already prepared");
      skippedPrep.push(folder);
    } else {
      console.log("Preparing folder: " + folder);
      await prepareDifyFolder(folder);
    }

    if (await filesInFolderExist(folder + "/from_dify")) {
      skippedProcess.push(folder);
      console.log(folder + " already processed");
      continue;
    }

    console.log("Sending Dify request for folder: " + folder);
    await sendDifyRequest(folder, fach);
  }
}

console.log("Skipped preparation for folders: ", skippedPrep);
console.log("Skipped processing folders: ", skippedProcess);
console.log("Done.");
