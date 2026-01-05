import mp3File from "../../assets/icons/file-audio.svg";
import Button from "../Button";
import type { Lecture } from "./types";

function Mp3Section({ lecture }: { lecture: Lecture }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Audioquellen (MP3)
      </h4>
      <div className="space-y-2">
        {lecture.mp3.length === 0
          ? <p className="text-sm text-gray-500 italic">Keine Audiodateien.</p>
          : (
            lecture.mp3.map((file: string) => (
              <div
                key={file}
                className="flex justify-between items-center p-2 rounded bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={mp3File} className="h-6 w-6" alt="MP3 icon" />
                  <a
                    href={"/dir-praxis/" + file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    {file}
                  </a>
                </div>
                {lecture.status === "preparing" && (
                  <button className="text-xs text-red-600 hover:text-red-700 px-2">
                    Löschen
                  </button>
                )}
              </div>
            ))
          )}
        {lecture.status === "preparing" && (
          <div className="mt-3">
            <Button name="+ Audio" variant="secondary" />
          </div>
        )}
      </div>
    </div>
  );
}

export default Mp3Section;
