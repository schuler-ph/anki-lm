import { useEffect, useState } from "react";

function Popover({
  id,
  label,
  contentUrl,
}: {
  id: string;
  label: string;
  contentUrl: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(contentUrl)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) setText(t); })
      .catch(() => { if (!cancelled) setText("(Fehler beim Laden)"); });
    return () => { cancelled = true; };
  }, [contentUrl]);

  return (
    <>
      <button
        popoverTarget={`popover-${id}`}
        popoverTargetAction="show"
        className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center h-full group"
      >
        <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">
          {label}
        </span>
        <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-wide">
          Anzeigen
        </span>
      </button>

      <div
        id={`popover-${id}`}
        popover="auto"
        className="fixed inset-0 m-auto w-full max-w-3xl h-[80vh] bg-white rounded-xl shadow-2xl p-0 overflow-hidden backdrop:bg-gray-900/50"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">{label}</h3>
        </div>
        <div
          className="p-8 overscroll-contain overflow-auto h-full pb-20"
          tabIndex={0}
          role="region"
        >
          {text === null
            ? <p className="text-sm text-gray-400">Wird geladen...</p>
            : <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">{text}</pre>}
        </div>
      </div>
    </>
  );
}

export default Popover;
