import { useState } from "react";
import { Link } from "react-router-dom";

function CookieBanner() {
  const [isDone, setIsDone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cookie-banner-dismissed") === "true";
    }
    return false;
  });

  function handleDone() {
    localStorage.setItem("cookie-banner-dismissed", "true");
    setIsDone(true);
  }

  if (isDone) return null;

  return (
    <aside
      className="w-full fixed bottom-0 bg-indigo-300 p-6 flex flex-col items-start z-50"
      role="region"
      aria-label="Cookie Banner"
    >
      <div className="max-w-96">
        Wir verwenden ausschließlich technisch notwendige Cookies, um den
        Service anzubieten. Wir setzen keine Affiliate- oder Tracking-Cookies
        ein.
      </div>
      <div className="flex flex-row gap-4 mt-5">
        <button
          className="underline px-2 py-1 bg-indigo-600 text-white border cursor-pointer"
          onClick={handleDone}
        >
          Verstanden
        </button>
        <Link
          to="/privacy"
          className="underline px-2 py-1 bg-white border"
        >
          Mehr erfahren
        </Link>
      </div>
    </aside>
  );
}

export default CookieBanner;
