import Mp3Section from "./Mp3Section";
import PdfSection from "./PdfSection";
import ProcessSection from "./ProcessSection";
import StatusChip from "./StatusChip";
import type { Content, Lecture } from "./types";


function Lectures({ currentItem }: {currentItem: Content}) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Vorlesungen & Verarbeitung
        </h2>
        <p className="text-sm text-gray-500">
          Verwalten Sie hier Ihre Aufzeichnungen. Der Status zeigt an, ob
          Lernmaterialien bereits generiert wurden.
        </p>
      </div>

      <div className="space-y-8">
        {currentItem.lectures.map((lecture: Lecture, index: number) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Header der Card */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{lecture.title}</h3>
              <StatusChip lecture={lecture} />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Mp3Section lecture={lecture} />
                <PdfSection lecture={lecture} />
              </div>

              {/* Trennlinie */}
              <div className="border-t border-gray-100"></div>

              <ProcessSection lecture={lecture} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Lectures;
