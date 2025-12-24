import { Link } from "react-router-dom";

function Links() {
  return (
    <div className="flex gap-2 items-center text-gray-700 text-sm">
      <Link to="/" className="hover:scale-110 transition-all">Home</Link>
      <Link to="/about" className="hover:scale-110 transition-all">About</Link>
    </div>
  );
}

export default Links;
