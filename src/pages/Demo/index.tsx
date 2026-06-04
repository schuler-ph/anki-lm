import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import BaseKnowledge from "../../components/Demo/BaseKnowledge";
import { BrandingIntro } from "../../components/Demo/BrandingIntro";
import Button from "../../components/Button";
import SimpleLink from "../../components/SimpleLink";

import summary from "../../components/Demo/artemis1/01-summary.mdx";
import veredelt from "../../components/Demo/artemis1/02-veredelt.mdx";
import tldr from "../../components/Demo/artemis1/03-tldr.mdx";
import konzepte from "../../components/Demo/artemis1/04-konzepte.mdx";
import beispiele from "../../components/Demo/artemis1/05-beispiele.mdx";
import anki from "../../components/Demo/artemis1/06-anki.mdx";
import transcription from "../../components/Demo/artemis1/Artemis1Briefing_transcription.mdx";

import mp3Icon from "../../assets/icons/file-audio.svg";
import pdfIcon from "../../assets/icons/file-pdf.svg";

// ── Local types (static demo only) ──────────────────────────────────────────

type DemoStatus = "preparing" | "processed";

type DemoResults = {
  summary: React.ComponentType<unknown>;
  veredelt: React.ComponentType<unknown>;
  tldr: React.ComponentType<unknown>;
  konzepte: React.ComponentType<unknown>;
  beispiele: React.ComponentType<unknown>;
  anki: React.ComponentType<unknown>;
};

type DemoLecture = {
  lid: number;
  title: string;
  status: DemoStatus;
  mp3: string[];
  pdf: string[];
  results?: DemoResults;
};

type DemoTopic = {
  id: number;
  title: string;
  body: string;
  knowledge: string[];
  lectures: DemoLecture[];
};

// ── Inline MDX Popover ───────────────────────────────────────────────────────

function MDXPopover({
  id,
  type,
  label,
  Content,
}: {
  id: number;
  type: string;
  label: string;
  Content: React.ComponentType<unknown>;
}) {
  return (
    <>
      <button
        popoverTarget={`demo-popover-${type}-${id}`}
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
        id={`demo-popover-${type}-${id}`}
        popover="auto"
        className="fixed inset-0 m-auto w-full h-full sm:h-[80vh] sm:max-w-3xl bg-white sm:rounded-xl shadow-2xl p-0 overflow-hidden flex-col [&:popover-open]:flex backdrop:bg-gray-900/50"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center gap-4 shrink-0">
          <h3 className="font-bold text-lg truncate">{label}</h3>
          <button
            popoverTarget={`demo-popover-${type}-${id}`}
            popoverTargetAction="hide"
            aria-label="Schließen"
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-8 overscroll-contain overflow-auto flex-1 min-h-0 prose max-w-none">
          <Content />
        </div>
      </div>
    </>
  );
}

// ── Status chip ──────────────────────────────────────────────────────────────

function DemoStatusChip({ status }: { status: DemoStatus }) {
  const styles = {
    processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    preparing: "bg-amber-100 text-amber-800 border-amber-200",
  };
  const labels = {
    processed: "Verarbeitung abgeschlossen",
    preparing: "Warte auf Input",
  };
  const dot = {
    processed: "bg-emerald-500",
    preparing: "bg-amber-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot[status]}`} />
      {labels[status]}
    </span>
  );
}

// ── Lecture card ─────────────────────────────────────────────────────────────

function DemoLectureCard({ lecture }: { lecture: DemoLecture }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">{lecture.title}</h3>
        <DemoStatusChip status={lecture.status} />
      </div>

      <div className="p-6 space-y-6">
        {/* Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Audioquellen (MP3)
            </h4>
            <div className="space-y-2">
              {lecture.mp3.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Keine Audiodateien.
                </p>
              ) : (
                lecture.mp3.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100"
                  >
                    <img src={mp3Icon} className="h-6 w-6" alt="MP3" />
                    <span className="text-sm text-gray-700 truncate">{f}</span>
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

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Folien & Skripte (PDF)
            </h4>
            <div className="space-y-2">
              {lecture.pdf.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Keine PDF Dateien.
                </p>
              ) : (
                lecture.pdf.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100"
                  >
                    <img src={pdfIcon} className="h-6 w-6" alt="PDF" />
                    <span className="text-sm text-gray-700 truncate">{f}</span>
                  </div>
                ))
              )}
              {lecture.status === "preparing" && (
                <div className="mt-3">
                  <Button name="+ PDF" variant="secondary" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Process section */}
        <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="font-bold text-gray-800">
                Generierte Lernmaterialien
              </h4>
              <p className="text-xs text-gray-500">
                AI-Pipeline Output (GPT-5 & Whisper)
              </p>
            </div>
            {lecture.status === "processed" && (
              <Button name="Reset & Löschen" variant="danger" />
            )}
          </div>

          {lecture.status === "preparing" ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Button name="AI-Pipeline starten" variant="primary" />
              <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto">
                Durch Klick bestätigen Sie die Übermittlung der Daten an OpenAI
                (USA) gemäß <SimpleLink to="/privacy" name="Datenschutz" />.
              </p>
            </div>
          ) : lecture.results === undefined ? (
            <p className="text-sm text-gray-500">Keine Ergebnisse verfügbar.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MDXPopover
                id={lecture.lid}
                type="summary"
                label="Zusammenfassung"
                Content={lecture.results.summary}
              />
              <MDXPopover
                id={lecture.lid}
                type="veredelt"
                label="Veredeltes Skript"
                Content={lecture.results.veredelt}
              />
              <MDXPopover
                id={lecture.lid}
                type="tldr"
                label="TL;DR"
                Content={lecture.results.tldr}
              />
              <MDXPopover
                id={lecture.lid}
                type="konzepte"
                label="Begriffsdefinitionen"
                Content={lecture.results.konzepte}
              />
              <MDXPopover
                id={lecture.lid}
                type="beispiele"
                label="Praxisbeispiele"
                Content={lecture.results.beispiele}
              />
              <MDXPopover
                id={lecture.lid}
                type="anki"
                label="Anki Karten Export"
                Content={lecture.results.anki}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Static content ───────────────────────────────────────────────────────────

const DEMO_CONTENT: DemoTopic[] = [
  {
    id: 0,
    title: "NASA",
    body: "Lernmaterialen zu den Artemis Missionen",
    knowledge: ["Artemis1ReferenceGuide.pdf", "Artemis2ReferenceGuide.pdf"],
    lectures: [
      {
        lid: 0,
        title: "Artemis 1 Briefing",
        status: "processed",
        mp3: ["Artemis1Briefing.mp3"],
        pdf: ["Artemis1PressKit.pdf"],
        results: { summary, veredelt, tldr, konzepte, beispiele, anki },
      },
      {
        lid: 1,
        title: "Artemis 2 Briefing",
        status: "preparing",
        mp3: ["Artemis2.mp3"],
        pdf: ["Artemis2.pdf"],
      },
    ],
  },
  {
    id: 1,
    title: "EU Recht",
    body: "Lernmaterialen zum AI Act der Europäischen Union",
    knowledge: ["AiActRaw.pdf"],
    lectures: [
      {
        lid: 0,
        title: "EU AI Act Overview",
        status: "preparing",
        mp3: [],
        pdf: [],
      },
    ],
  },
];

// suppress unused import warning — transcription is referenced below as a demo artefact
void transcription;

// ── Page ─────────────────────────────────────────────────────────────────────

function Demo() {
  const [currentItem, setCurrentItem] = useState(DEMO_CONTENT[0]);
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showIntro && <BrandingIntro onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      <div
        className={`flex flex-col md:grid md:grid-cols-12 min-h-screen ${
          showIntro ? "overflow-hidden h-screen" : ""
        }`}
      >
        <aside className="flex flex-col md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
          <h2 className="font-bold border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider p-4 pl-4 md:pl-10 pb-2">
            Themen
          </h2>
          <div className="px-2 md:pl-6 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
            {DEMO_CONTENT.map((item) => (
              <button
                key={item.id}
                className={
                  "py-3 px-4 cursor-pointer text-left hover:bg-indigo-50 transition-colors shrink-0 whitespace-nowrap border-b-4 md:border-b-0 md:border-l-4 " +
                  (currentItem.id === item.id
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium"
                    : "border-transparent text-gray-600")
                }
                onClick={() => setCurrentItem(item)}
              >
                {item.title}
              </button>
            ))}
            <button className="my-2 mx-4 py-2 px-4 border border-dashed border-gray-300 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm shrink-0 whitespace-nowrap self-center md:self-auto">
              + Neues Thema
            </button>
          </div>
        </aside>

        <article className="md:col-span-9">
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentItem.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{currentItem.body}</p>
          </header>

          <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
            <BaseKnowledge currentItem={currentItem} />

            <section>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Vorlesungen & Verarbeitung
                </h2>
                <p className="text-sm text-gray-500">
                  Verwalten Sie hier Ihre Aufzeichnungen. Der Status zeigt an,
                  ob Lernmaterialien bereits generiert wurden.
                </p>
              </div>
              <div className="space-y-8">
                {currentItem.lectures.map((lecture) => (
                  <DemoLectureCard key={lecture.lid} lecture={lecture} />
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}

export default Demo;
