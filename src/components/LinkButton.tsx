import { Link } from "react-router-dom";

function LinkButton({ to, name }: { to: string; name: string }) {
  return (
    <>
      <Link
        to={to}
        className="bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {name}
      </Link>
    </>
  );
}

export default LinkButton;
