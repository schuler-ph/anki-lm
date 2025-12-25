import Mp3Section from "./Mp3Section";
import PdfSection from "./PdfSection";
import ProcessSection from "./ProcessSection";
import StatusChip from "./StatusChip";

function Lectures(
  { currentItem }: {
    currentItem: {
      lectures: {
        title: string;
        status: "processed" | "preparing";
        mp3: string[];
        pdf: string[];
        lid: number;
        results?: {
          summary: React.ComponentType<unknown>;
          veredelt: React.ComponentType<unknown>;
          tldr: React.ComponentType<unknown>;
          konzepte: React.ComponentType<unknown>;
          beispiele: React.ComponentType<unknown>;
          anki: React.ComponentType<unknown>;
        };
      }[];
    };
  },
) {
  return (
    <>
      <h2 className="font-semibold pt-6">II: Vorlesungen</h2>
      <p className="text-xs">
        Das Grundwissen, es wird während der Verarbeitung der Vorlesung
        abgefragt, um gezielt relevante Informationen für die Erstellung der
        Lernmaterialien zum Kontext hinzuzufügen. Gut geeignet dafür sind große
        PDFs, die sonst nicht in den Kontext passen würden. Dafür wird die RAG
        Technologie verwendet.
      </p>

      {currentItem.lectures.map((lecture, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-sm p-4 my-4"
        >
          <h3 className="font-semibold">{lecture.title}</h3>

          <Mp3Section lecture={lecture} />
          <PdfSection lecture={lecture} />
          <StatusChip status={lecture.status} />
          <ProcessSection lecture={lecture} />
        </div>
      ))}
    </>
  );
}

export default Lectures;
