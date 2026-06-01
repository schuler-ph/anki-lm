import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authHeaders } from "./api";

function Popover({
  id,
  label,
  contentUrl,
}: {
  id: string;
  label: string;
  contentUrl: string;
}) {
  const [text, setText] = useState<string | null | "idle">("idle");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const handleToggle = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open") return;
      if (text !== "idle") return;
      setText(null);
      authHeaders()
        .then((headers) => fetch(contentUrl, { headers }))
        .then((r) => r.text())
        .then((t) => setText(t))
        .catch(() => setText("(Fehler beim Laden)"));
    };
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, [contentUrl, text]);

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
        ref={popoverRef}
        id={`popover-${id}`}
        popover="auto"
        className="fixed inset-0 m-auto w-full max-w-3xl h-[80vh] bg-white rounded-xl shadow-2xl p-0 overflow-hidden backdrop:bg-gray-900/50"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">{label}</h3>
        </div>
        <div
          className="p-8 overscroll-contain overflow-auto h-full pb-20 prose prose-sm max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-li:text-gray-700
            prose-table:text-sm prose-th:bg-gray-50 prose-td:align-top"
          tabIndex={0}
          role="region"
        >
          {text === "idle" || text === null
            ? <p className="text-sm text-gray-400 not-prose">Wird geladen...</p>
            : <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>}
        </div>
      </div>
    </>
  );
}

export default Popover;
