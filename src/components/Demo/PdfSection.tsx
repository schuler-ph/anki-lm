import { Link } from "react-router-dom";
import pdfFile from "../../assets/icons/file-pdf.svg";

function PdfSection({ lecture }: { lecture: { pdf: string[] } }) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold">II.2: PDF Dateien</h4>
      {lecture.pdf.length === 0
        ? (
          <p className="italic text-sm my-2">
            Keine PDF Dateien hochgeladen.
          </p>
        )
        : lecture.pdf.map((file) => (
          <div
            key={file}
            className="flex justify-between items-center border border-gray-200 rounded-sm my-2 p-2"
          >
            <div className="flex flex-row items-center gap-2">
              <img src={pdfFile} className="h-8" alt="PDF file icon" />
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
      <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
        PDF hinzufügen
      </button>
      <p className="text-xs">
        Hinweis zum Datenschutz: Ihre Dateien werden zur Verarbeitung an OpenAI
        (USA) übertragen. Mehr Infos in der{" "}
        <Link to="/privacy" className="text-indigo-600 underline">
          Datenschutzerklärung
        </Link>.
      </p>
    </div>
  );
}

export default PdfSection;
