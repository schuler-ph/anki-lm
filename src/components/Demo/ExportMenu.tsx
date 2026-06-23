import { useEffect, useRef, useState } from "react";
import { exportZip } from "./api";

const EXPORT_TYPES: { type: string; label: string }[] = [
  { type: "slides", label: "Alle Folien (PDF)" },
  { type: "summary", label: "Alle Zusammenfassungen" },
  { type: "anki", label: "Alle Anki-Decks (CSV)" },
  { type: "veredelt", label: "Alle veredelten Skripte" },
  { type: "tldr", label: "Alle TL;DRs" },
  { type: "konzepte", label: "Alle Begriffsdefinitionen" },
  { type: "beispiele", label: "Alle Praxisbeispiele" },
  { type: "all", label: "Alles (komplettes Paket)" },
];

function ExportMenu({ fach }: { fach: string }) {
  const [open, setOpen] = useState(false);
  const [allTopics, setAllTopics] = useState(false);
  const [busyType, setBusyType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleExport(type: string) {
    setBusyType(type);
    setError(null);
    try {
      await exportZip(type, allTopics ? "all" : `fach:${fach}`);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusyType(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
          <path d="M4 16a1 1 0 100 2h12a1 1 0 100-2H4z" />
        </svg>
        Export
        <span
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
          <label className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 border-b border-gray-100 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={allTopics}
              onChange={(e) => setAllTopics(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
            />
            Über alle Themen exportieren
          </label>

          {EXPORT_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              disabled={busyType !== null}
              onClick={() => handleExport(type)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-between"
            >
              {label}
              {busyType === type && (
                <span className="text-xs text-gray-400">lädt…</span>
              )}
            </button>
          ))}

          {error && (
            <p className="text-xs text-red-600 px-3 py-2 border-t border-gray-100 mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
