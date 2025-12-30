import bookFile from "../../assets/icons/book.svg";
import Button from "../Button"; // Nutzen wir unseren neuen Button
import SimpleLink from "../SimpleLink";

function BaseKnowledge(
  { currentItem }: { currentItem: { knowledge: string[] } },
) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Grundwissen & RAG-Kontext
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Laden Sie hier große Skripte (PDFs) hoch. Diese dienen als
          Wissensbasis für die KI, um Fragen präzise zu beantworten (Retrieval
          Augmented Generation).
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {currentItem.knowledge.length === 0
          ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                Keine Wissensbasis vorhanden.
              </p>
            </div>
          )
          : (
            currentItem.knowledge.map((file) => (
              <div
                key={file}
                className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-3 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={bookFile}
                    className="h-8 w-8 opacity-80"
                    alt="Book icon"
                  />
                  <SimpleLink
                    to={"/dir-praxis/" + file}
                    name={file}
                    target="_blank"
                  />
                </div>
                <Button name="Entfernen" variant="danger" />
              </div>
            ))
          )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-t border-gray-100 pt-4">
        <Button name="PDF Wissen hochladen" variant="primary" />

        {/* Datenschutzhinweis optisch abgesetzt */}
        <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded border border-blue-100 max-w-md">
          <span className="font-semibold text-blue-700">
            Datenschutzhinweis:
          </span>{" "}
          Dateien werden zur Vektorisierung an OpenAI (USA) übertragen. Details
          siehe <SimpleLink to="/privacy" name="Datenschutzerklärung" />.
        </div>
      </div>
    </section>
  );
}

export default BaseKnowledge;
