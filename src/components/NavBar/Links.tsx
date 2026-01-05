import { Link } from "react-router-dom";

function Links() {
  return (
    <div className="flex gap-3 items-center text-gray-700 text-sm">
      <Link
        to="/"
        className="hover:scale-110 transition-all hover:text-indigo-600"
      >
        Home
      </Link>
      <Link
        to="/prices"
        className="hover:scale-110 transition-all hover:text-indigo-600"
      >
        Preise
      </Link>
      <Link
        to="/faq"
        className="hover:scale-110 transition-all hover:text-indigo-600"
      >
        FAQ
      </Link>

      <Link
        to="/about"
        className="hover:scale-110 transition-all hover:text-indigo-600"
      >
        About
      </Link>
    </div>
  );
}

export default Links;
