import { useState } from "react";
import BaseKnowledge from "../../components/Demo/BaseKnowledge";
import Lectures from "../../components/Demo/Lectures";

import summary from "../../content/artemis1/01-summary.mdx";
import veredelt from "../../content/artemis1/02-veredelt.mdx";
import tldr from "../../content/artemis1/03-tldr.mdx";
import konzepte from "../../content/artemis1/04-konzepte.mdx";
import beispiele from "../../content/artemis1/05-beispiele.mdx";
import anki from "../../content/artemis1/06-anki.mdx";

const content = [
  {
    id: 0,
    title: "NASA",
    body: "Test Nasa",
    knowledge: ["Artemis1ReferenceGuide.pdf", "Artemis2ReferenceGuide.pdf"],
    lectures: [{
      lid: 0,
      title: "Artemis 1 Briefing",
      status: "processed" as const,
      mp3: ["Artemis1Briefing.mp3"],
      pdf: ["Artemis1PressKit.pdf"],
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
      status: "preparing" as const,
      mp3: [],
      pdf: [],
    }],
  },
  {
    id: 1,
    title: "EU Recht",
    body: "Test AI Act",
    knowledge: ["AiActRaw.pdf"],
    lectures: [{
      lid: 0,
      title: "EU AI Act Overview",
      status: "preparing" as const,
      mp3: [],
      pdf: [],
    }],
  },
];

function Demo() {
  const [currentItem, setCurrentItem] = useState(content[0]);

  return (
    <div className="grid grid-cols-12">
      <aside className="flex flex-col col-span-3">
        <h1 className="font-bold border-b border-gray-200">Themen</h1>
        {content.map((item) => (
          <button
            key={item.id}
            className={"border-b border-r border-l border-gray-200 py-4 px-4 cursor-pointer text-left hover:bg-indigo-50 " +
              (currentItem.id === item.id ? "bg-indigo-100" : "")}
            onClick={() => setCurrentItem(item)}
          >
            {item.title}
          </button>
        ))}
        <button className="border-b border-r border-l border-gray-200 py-1 px-4 w-full cursor-pointer text-left hover:bg-indigo-50">
          + Neues Thema
        </button>
      </aside>
      <article className="col-span-9 col-start-4">
        <h1 className="font-bold border-b border-gray-200 pl-6">Content</h1>
        <div className="px-6">
          <BaseKnowledge currentItem={currentItem} />
          <Lectures currentItem={currentItem} />
        </div>
      </article>
    </div>
  );
}

export default Demo;
