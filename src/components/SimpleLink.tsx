import { Link } from "react-router-dom";

function SimpleLink(
  { to, target, name }: { to: string; target?: string; name: string },
) {
  return (
    <Link to={to} target={target} className="text-indigo-600 underline">
      {name}
    </Link>
  );
}

export default SimpleLink;
