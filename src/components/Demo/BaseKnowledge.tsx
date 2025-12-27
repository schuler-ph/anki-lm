import { Link } from "react-router-dom";
import bookFile from "../../assets/icons/book.svg";

function BaseKnowledge(
  { currentItem }: { currentItem: { knowledge: string[] } },
) {
  return (
    <>
      <h2 className="font-semibold pt-6">I: Grundwissen</h2>
      <p className="text-xs">
        Das Grundwissen, es wird während der Verarbeitung der Vorlesung
        abgefragt, um gezielt relevante Informationen für die Erstellung der
        Lernmaterialien zum Kontext hinzuzufügen. Gut geeignet dafür sind große
        PDFs, die sonst nicht in den Kontext passen würden. Dafür wird die RAG
        Technologie verwendet.
      </p>

      <div>
        {currentItem.knowledge.length === 0
          ? (
            <p className="italic text-sm my-2">
              Kein Grundwissen hochgeladen.
            </p>
          )
          : currentItem.knowledge.map((file) => (
            <div
              key={file}
              className="flex justify-between items-center border border-gray-200 rounded-sm my-2 p-2"
            >
              <div className="flex flex-row items-center gap-2">
                <img src={bookFile} className="h-8" alt="Book file icon" />
                <a
                  href={"/dir-praxis/" + file}
                  className="text-indigo-600 underline"
                >
                  {file}
                </a>
              </div>
              <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
                Entfernen
              </button>
            </div>
          ))}
      </div>

      <button className="rounded-sm w-full bg-gray-300 px-2 py-1 cursor-pointer">
        Upload
      </button>
      <p className="text-xs">
        Hinweis zum Datenschutz: Ihre Dateien werden zur Verarbeitung an OpenAI
        (USA) übertragen. Mehr Infos in der{" "}
        <Link to="/privacy" className="text-indigo-600 underline">
          Datenschutzerklärung
        </Link>.
      </p>
    </>
  );
}

export default BaseKnowledge;
