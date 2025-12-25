import { useState } from "react";
import BaseKnowledge from "./BaseKnowledge";
import Lectures from "./Lectures";

const content = [
  {
    id: 0,
    title: "NASA",
    body: "Test Nasa",
    knowledge: ["Artemis1ReferenceGuide.pdf", "Artemis2ReferenceGuide.pdf"],
    lectures: [{
      title: "Artemis 1 Briefing",
      status: "processed",
      mp3: ["Artemis1Briefing.mp3"],
      pdf: ["Artemis1PressKit.pdf"],
    }],
  },
  {
    id: 1,
    title: "EU Recht",
    body: "Test AI Act",
    knowledge: [],
    lectures: [{
      title: "EU AI Act Overview",
      status: "preparing",
      mp3: [],
      pdf: [],
    }],
  },
];

function Demo() {
  const [currentItem, setCurrentItem] = useState(content[0]);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-3">
        <h1 className="font-bold border-b border-gray-200">Themen</h1>
        {content.map((item) => (
          <button
            key={item.id}
            className="border-b border-r border-l border-gray-200 py-6 px-4 w-full cursor-pointer text-left hover:bg-indigo-50"
            onClick={() => setCurrentItem(item)}
          >
            {item.title}
          </button>
        ))}
        <button className="border-b border-r border-l border-gray-200 py-6 px-4 w-full cursor-pointer text-left hover:bg-indigo-50">
          + Neues Thema
        </button>
      </div>
      <div className="col-span-9 col-start-4">
        <h1 className="font-bold border-b border-gray-200 pl-6">Content</h1>
        <div className="px-6">
          <BaseKnowledge currentItem={currentItem} />
          <Lectures currentItem={currentItem} />
        </div>
      </div>
    </div>
  );
}

export default Demo;
