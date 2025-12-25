import { Link } from "react-router-dom";

function LoginAndSignup() {
  return (
    <div className="flex gap-2 items-center">
      <Link to="/demo" className="rounded-sm px-2 py-1">
        Login
      </Link>
      <Link
        to="/demo"
        className="rounded-sm px-2 py-1 text-white bg-indigo-400"
      >
        Start Free
      </Link>
    </div>
  );
}

export default LoginAndSignup;
