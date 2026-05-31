import Popover from "./Popover";
import SimpleLink from "../SimpleLink";
import { API_BASE } from "./api";
import type { Lecture } from "./types";

const OUTPUT_TILES: { key: string; label: string }[] = [
  { key: "01-summary", label: "Zusammenfassung" },
  { key: "02-veredelt", label: "Veredeltes Skript" },
  { key: "03-tldr", label: "TL;DR" },
  { key: "04-konzepte", label: "Begriffsdefinitionen" },
  { key: "05-beispiele", label: "Praxisbeispiele" },
  { key: "06-anki", label: "Anki Karten Export" },
];

function ProcessSection({
  lecture,
  onStart,
}: {
  lecture: Lecture;
  onStart: () => void;
}) {
  return (
    <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h4 className="font-bold text-gray-800">Generierte Lernmaterialien</h4>
          <p className="text-xs text-gray-500">AI-Pipeline Output (GPT-5 & Whisper)</p>
        </div>
      </div>

      {lecture.status === "preparing" && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <button
            onClick={onStart}
            className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            AI-Pipeline starten
          </button>
          <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto">
            Durch Klick bestätigen Sie die Übermittlung der Daten an OpenAI
            (USA) gemäß <SimpleLink to="/privacy" name="Datenschutz" />.
          </p>
        </div>
      )}

      {lecture.status === "processing" && (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-indigo-700 font-medium">
            Verarbeitung läuft... (ca. 2–5 Minuten)
          </p>
        </div>
      )}

      {lecture.status === "processed" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {OUTPUT_TILES.map(({ key, label }) => {
            const exists = lecture.outputFiles[key];
            return exists
              ? (
                <Popover
                  key={key}
                  id={`${lecture.id}-${key}`}
                  label={label}
                  contentUrl={`${API_BASE}/api/jobs/${lecture.id}/output/${key}`}
                />
              )
              : null;
          })}
        </div>
      )}

      {lecture.status === "failed" && (
        <div className="py-4 text-center space-y-3">
          <p className="text-sm text-red-600 font-medium">Verarbeitung fehlgeschlagen</p>
          {lecture.error && (
            <p className="text-xs text-red-400 font-mono whitespace-pre-wrap text-left bg-red-50 rounded p-3">{lecture.error}</p>
          )}
          <button
            onClick={onStart}
            className="mt-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}

export default ProcessSection;
