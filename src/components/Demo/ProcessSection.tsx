import { Link } from "react-router-dom";
import Button from "../Button";
import Popover from "./Popover";
import type { Lecture } from "./types";

function ProcessSection({ lecture }: { lecture: Lecture }) {
  return (
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

      {lecture.status === "preparing"
        ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Button name="AI-Pipeline starten" variant="primary" />
            <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto">
              Durch Klick bestätigen Sie die Übermittlung der Daten an OpenAI
              (USA) gemäß{" "}
              <Link to="/privacy" className="underline text-indigo-600">
                Datenschutz
              </Link>.
            </p>
          </div>
        )
        : lecture.results === undefined
        ? <p className="text-sm text-gray-500">Keine Ergebnisse verfügbar.</p>
        : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Hier generieren wir Kacheln statt nur Buttons */}
            <Popover
              lid={lecture.lid}
              type="summary"
              label="Zusammenfassung"
              Content={lecture.results.summary}
            />
            <Popover
              lid={lecture.lid}
              type="veredelt"
              label="Skript (Lektorat)"
              Content={lecture.results.veredelt}
            />
            <Popover
              lid={lecture.lid}
              type="tldr"
              label="TL;DR"
              Content={lecture.results.tldr}
            />
            <Popover
              lid={lecture.lid}
              type="konzepte"
              label="Begriffsdefinitionen"
              Content={lecture.results.konzepte}
            />
            <Popover
              lid={lecture.lid}
              type="beispiele"
              label="Praxisbeispiele"
              Content={lecture.results.beispiele}
            />
            <Popover
              lid={lecture.lid}
              type="anki"
              label="Anki Karten Export"
              Content={lecture.results.anki}
            />
          </div>
        )}
    </div>
  );
}

export default ProcessSection;
