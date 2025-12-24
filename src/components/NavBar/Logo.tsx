import { Link } from "react-router-dom";
import ankiLmLogo from "/ankilm-new.svg";

function Logo() {
  return (
    <Link to="/">
      <div className="flex gap-2 items-center">
        <img src={ankiLmLogo} className="h-8" alt="AnkiLM logo" />
        <span className="text-xl font-bold">AnkiLM</span>
      </div>
    </Link>
  );
}

export default Logo;
