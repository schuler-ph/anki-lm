import { useEffect, useRef, useState } from "react";
import Popover from "./Popover";
import SimpleLink from "../SimpleLink";
import { API_BASE, fetchIntermediates } from "./api";
import type { Lecture } from "./types";

const OUTPUT_TILES: { key: string; label: string }[] = [
  { key: "01-summary", label: "Zusammenfassung" },
  { key: "02-veredelt", label: "Veredeltes Skript" },
  { key: "03-tldr", label: "TL;DR" },
  { key: "04-konzepte", label: "Begriffsdefinitionen" },
  { key: "05-beispiele", label: "Praxisbeispiele" },
  { key: "06-anki", label: "Anki Karten Export" },
];

type IntermediateFile = { name: string; url: string };

function IntermediatePopover({ file, lectureId }: { file: IntermediateFile; lectureId: string }) {
  const id = `interm-${lectureId}-${file.name.replace(/\./g, "-")}`;
  const isPdf = file.name.endsWith(".pdf");
  const label = file.name;
  const [text, setText] = useState<string | null | "idle">("idle");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPdf) return;
    const el = popoverRef.current;
    if (!el) return;
    const handleToggle = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open") return;
      if (text !== "idle") return;
      setText(null);
      fetch(file.url)
        .then((r) => r.text())
        .then((t) => setText(t))
        .catch(() => setText("(Fehler beim Laden)"));
    };
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, [file.url, isPdf, text]);

  return (
    <>
      <button
        popoverTarget={`popover-${id}`}
        popoverTargetAction="show"
        className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md hover:border-indigo-300 text-gray-600 hover:text-indigo-600 transition-colors"
      >
        {label}
      </button>

      <div
        ref={popoverRef}
        id={`popover-${id}`}
        popover="auto"
        className="fixed inset-0 m-auto w-full max-w-3xl h-[80vh] bg-white rounded-xl shadow-2xl p-0 overflow-hidden backdrop:bg-gray-900/50"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <h3 className="font-bold text-lg">{label}</h3>
        </div>
        {isPdf
          ? <iframe src={file.url} className="w-full h-full border-0" title={label} />
          : (
            <div className="p-8 overflow-auto h-full pb-20 font-mono text-sm whitespace-pre-wrap text-gray-700">
              {text === "idle" || text === null
                ? <p className="text-sm text-gray-400 font-sans">Wird geladen...</p>
                : text}
            </div>
          )}
      </div>
    </>
  );
}

function ProcessSection({
  lecture,
  onStart,
}: {
  lecture: Lecture;
  onStart: () => void;
}) {
  const [intermediates, setIntermediates] = useState<IntermediateFile[]>([]);

  useEffect(() => {
    if (lecture.status === "preparing") return;
    fetchIntermediates(lecture.id).then(setIntermediates).catch(() => {});
  }, [lecture.id, lecture.status]);

  return (
    <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h4 className="font-bold text-gray-800">Generierte Lernmaterialien</h4>
          <p className="text-xs text-gray-500">AI-Pipeline Output (GPT-5 & Whisper)</p>
        </div>
      </div>

      {intermediates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {intermediates.map((f) => (
            <IntermediatePopover key={f.name} file={f} lectureId={lecture.id} />
          ))}
        </div>
      )}

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
