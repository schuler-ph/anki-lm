import { Link } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/prices", label: "Preise" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
];

function Links({
  vertical = false,
  onNavigate,
}: {
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={
        vertical
          ? "flex flex-col gap-1 text-gray-700"
          : "flex gap-3 items-center text-gray-700 text-sm"
      }
    >
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={
            vertical
              ? "py-3 px-2 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              : "hover:scale-110 transition-all hover:text-indigo-600"
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export default Links;
