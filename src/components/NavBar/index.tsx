import { useEffect, useState } from "react";

import Links from "./Links";
import LoginAndSignup from "./LoginAndSignup";
import Logo from "./Logo";

function NavBar() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open, restoring whatever
  // value was there before so we don't clobber other scroll managers.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Auto-close the menu when the viewport grows to the desktop (md) layout,
  // where the panel/backdrop are hidden and there is no visible close control.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className="bg-gray-50 px-4 sm:px-6 flex gap-4 justify-between fixed top-0 left-0 right-0 h-20 items-center border-b border-gray-200 z-50">
      <Logo />

      {/* Desktop navigation */}
      <div className="hidden md:flex items-center gap-4">
        <Links />
        <LoginAndSignup />
      </div>

      {/* Burger button (mobile only) */}
      <button
        type="button"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 cursor-pointer -mr-1"
      >
        <span
          className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-gray-800 transition-opacity duration-200 ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {/* Mobile dropdown panel + backdrop */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Menü schließen"
            onClick={close}
            className="md:hidden fixed inset-0 top-20 bg-gray-900/40 z-40 cursor-default"
          />
          <div className="md:hidden fixed top-20 left-0 right-0 bg-gray-50 border-b border-gray-200 shadow-lg z-50 px-4 py-4 flex flex-col gap-4 max-h-[calc(100dvh-5rem)] overflow-y-auto">
            <Links vertical onNavigate={close} />
            <div className="border-t border-gray-200 pt-4">
              <LoginAndSignup stacked onAction={close} />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export default NavBar;
