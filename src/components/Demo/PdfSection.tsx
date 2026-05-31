import pdfIcon from "../../assets/icons/file-pdf.svg";
import type { Lecture } from "./types";

function PdfSection({ lecture }: { lecture: Lecture }) {
  const filename = lecture.pdfGcsPath
    ? lecture.pdfGcsPath.split("/").pop() ?? "input.pdf"
    : null;

  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Folien & Skripte (PDF)
      </h4>
      <div className="space-y-2">
        {filename
          ? (
            <div className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100">
              <img src={pdfIcon} className="h-6 w-6" alt="PDF icon" />
              <span className="text-sm text-gray-700 truncate">{filename}</span>
              <span className="ml-auto text-xs text-emerald-600">✓ hochgeladen</span>
            </div>
          )
          : (
            <p className="text-sm text-gray-500 italic">Keine PDF Dateien.</p>
          )}
      </div>
    </div>
  );
}

export default PdfSection;
