import mp3Icon from "../../assets/icons/file-audio.svg";
import type { Lecture } from "./types";

function Mp3Section({ lecture }: { lecture: Lecture }) {
  const paths = lecture.mp3GcsPaths ?? [];
  const names = lecture.mp3OriginalNames ?? [];

  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Audioquellen (MP3)
      </h4>
      <div className="space-y-2">
        {paths.length > 0
          ? paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100">
              <img src={mp3Icon} className="h-6 w-6" alt="MP3 icon" />
              <span className="text-sm text-gray-700 truncate">{names[i] ?? p.split("/").pop() ?? "input.mp3"}</span>
              <span className="ml-auto text-xs text-emerald-600">✓ hochgeladen</span>
            </div>
          ))
          : (
            <p className="text-sm text-gray-500 italic">Keine Audiodateien.</p>
          )}
      </div>
    </div>
  );
}

export default Mp3Section;
