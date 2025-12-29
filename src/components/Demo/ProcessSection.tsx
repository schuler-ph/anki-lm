import { Link } from "react-router-dom";
import Button from "../Button";
import Popover from "./Popover";

function ProcessSection(
  { lecture }: {
    lecture: {
      status: string;
      lid: number;
      results?: {
        summary: React.ComponentType<unknown>;
        veredelt: React.ComponentType<unknown>;
        tldr: React.ComponentType<unknown>;
        konzepte: React.ComponentType<unknown>;
        beispiele: React.ComponentType<unknown>;
        anki: React.ComponentType<unknown>;
      };
    };
  },
) {
  return (
    <>
      <h2 className="font-semibold pt-6">II.4: Verarbeitung</h2>

      {lecture.status === "preparing"
        ? (
          <>
            <Button name="Verarbeitung starten..." />
            <p className="text-xs">
              Hinweis zum Datenschutz: Ihre Dateien werden zur Verarbeitung an
              OpenAI (USA) übertragen. Mehr Infos in der{" "}
              <Link to="/privacy" className="text-indigo-600 underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </>
        )
        : lecture.results === undefined
        ? <>Keine Ergebnisse</>
        : (
          <div>
            <Popover
              lid={lecture.lid}
              type="summary"
              Content={lecture.results.summary}
            />
            <Popover
              lid={lecture.lid}
              type="veredelt"
              Content={lecture.results.veredelt}
            />
            <Popover
              lid={lecture.lid}
              type="tldr"
              Content={lecture.results.tldr}
            />
            <Popover
              lid={lecture.lid}
              type="konzepte"
              Content={lecture.results.konzepte}
            />
            <Popover
              lid={lecture.lid}
              type="beispiele"
              Content={lecture.results.beispiele}
            />
            <Popover
              lid={lecture.lid}
              type="anki"
              Content={lecture.results.anki}
            />
          </div>
        )}
    </>
  );
}

export default ProcessSection;
