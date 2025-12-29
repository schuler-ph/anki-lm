import { useState } from "react";

function CookieBanner() {
  const [isDone, setIsDone] = useState(false);

  return (
    <div
      className="w-full fixed bottom-0 bg-indigo-300 p-4 h-96 flex flex-col items-start"
      hidden={isDone}
    >
      Wir nutzen Cookies und AI-Technologien.
      <div className="flex flex-row gap-4">
        <button
          className="underline px-2 py-1 bg-indigo-600 text-white border"
          onClick={() => setIsDone(true)}
        >
          Akzeptieren
        </button>
        <button
          className="underline px-2 py-1 bg-white border"
          onClick={() => setIsDone(true)}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}

export default CookieBanner;
