import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import BaseKnowledge from "../../components/Demo/BaseKnowledge";
import Lectures from "../../components/Demo/Lectures";

import summary from "../../components/Demo/artemis1/01-summary.mdx";
import veredelt from "../../components/Demo/artemis1/02-veredelt.mdx";
import tldr from "../../components/Demo/artemis1/03-tldr.mdx";
import konzepte from "../../components/Demo/artemis1/04-konzepte.mdx";
import beispiele from "../../components/Demo/artemis1/05-beispiele.mdx";
import anki from "../../components/Demo/artemis1/06-anki.mdx";
import transcription from "../../components/Demo/artemis1/Artemis1Briefing_transcription.mdx";

import type { Content } from "../../components/Demo/types";
import { BrandingIntro } from "../../components/Demo/BrandingIntro";

const content: Content[] = [
  {
    id: 0,
    title: "NASA",
    body: "Lernmaterialen zu den Artemis Missionen",
    knowledge: ["Artemis1ReferenceGuide.pdf", "Artemis2ReferenceGuide.pdf"],
    lectures: [{
      lid: 0,
      title: "Artemis 1 Briefing",
      status: "processed",
      mp3: ["Artemis1Briefing.mp3"],
      transcriptions: [
        {
          name: "Artemis 1 Briefing Transcription",
          content: transcription,
        },
      ],
      pdf: ["Artemis1PressKit.pdf"],
      numbered: [
        "Artemis1PressKit_numbered.pdf",
      ],
      results: {
        summary,
        veredelt,
        tldr,
        konzepte,
        beispiele,
        anki,
      },
    }, {
      lid: 1,
      title: "Artemis 2 Briefing",
      status: "preparing",
      mp3: ["Artemis2.mp3"],
      pdf: ["Artemis2.pdf"],
    }],
  },
  {
    id: 1,
    title: "EU Recht",
    body: "Lernmaterialen zum AI Act der Europäischen Union",
    knowledge: ["AiActRaw.pdf"],
    lectures: [{
      lid: 0,
      title: "EU AI Act Overview",
      status: "preparing",
      mp3: [],
      pdf: [],
    }],
  },
];

function Demo() {
  const [currentItem, setCurrentItem] = useState(content[0]);

  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showIntro && <BrandingIntro onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      <div
        className={`grid grid-cols-12 min-h-screen ${
          showIntro ? "overflow-hidden h-screen" : ""
        }`}
      >
        <aside className="flex flex-col col-span-3 border-r border-gray-200 bg-white">
          <h2 className="font-bold border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider p-4 pl-10 pb-2">
            Themen
          </h2>
          <div className="pl-6 flex flex-col">
            {content.map((item) => (
              <button
                key={item.id}
                className={"py-3 px-4 cursor-pointer text-left hover:bg-indigo-50 transition-colors border-l-4 " +
                  (currentItem.id === item.id
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium"
                    : "border-transparent text-gray-600")}
                onClick={() => setCurrentItem(item)}
              >
                {item.title}
              </button>
            ))}
            <button className="mt-2 mx-4 py-2 px-4 border border-dashed border-gray-300 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm">
              + Neues Thema
            </button>
          </div>
        </aside>

        <article className="col-span-9">
          <header className="bg-white border-b border-gray-200 px-8 py-6 pr-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentItem.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{currentItem.body}</p>
          </header>

          <div className="px-8 py-8 space-y-8">
            <BaseKnowledge currentItem={currentItem} />
            <Lectures currentItem={currentItem} />
          </div>
        </article>
      </div>
    </>
  );
}

export default Demo;
