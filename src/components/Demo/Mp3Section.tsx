import { Link } from "react-router-dom";
import mp3File from "../../assets/icons/file-audio.svg";

function Mp3Section({ lecture }: { lecture: { mp3: string[] } }) {
  return (
    <>
      <div className="mt-2">
        <h4 className="font-semibold">II.1: MP3 Dateien</h4>
        {lecture.mp3.length === 0
          ? (
            <p className="italic text-sm my-2">
              Keine MP3 Dateien hochgeladen.
            </p>
          )
          : lecture.mp3.map((file) => (
            <div
              key={file}
              className="flex justify-between items-center border border-gray-200 rounded-sm my-2 p-2"
            >
              <div className="flex flex-row items-center gap-2">
                <img src={mp3File} className="h-8" alt="MP3 file icon" />

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
          MP3 hinzufügen
        </button>
        <p className="text-xs">
          Hinweis zum Datenschutz: Ihre Dateien werden zur Verarbeitung an
          OpenAI (USA) übertragen. Mehr Infos in der{" "}
          <Link to="/privacy" className="text-indigo-600 underline">
            Datenschutzerklärung
          </Link>.
        </p>
      </div>
    </>
  );
}

export default Mp3Section;
