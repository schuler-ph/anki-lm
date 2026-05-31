import mp3Icon from "../../assets/icons/file-audio.svg";
import type { Lecture } from "./types";

function Mp3Section({ lecture }: { lecture: Lecture }) {
  const filename = lecture.mp3GcsPath
    ? lecture.mp3GcsPath.split("/").pop() ?? "input.mp3"
    : null;

  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Audioquellen (MP3)
      </h4>
      <div className="space-y-2">
        {filename
          ? (
            <div className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100">
              <img src={mp3Icon} className="h-6 w-6" alt="MP3 icon" />
              <span className="text-sm text-gray-700 truncate">{filename}</span>
              <span className="ml-auto text-xs text-emerald-600">✓ hochgeladen</span>
            </div>
          )
          : (
            <p className="text-sm text-gray-500 italic">Keine Audiodateien.</p>
          )}
      </div>
    </div>
  );
}

export default Mp3Section;
