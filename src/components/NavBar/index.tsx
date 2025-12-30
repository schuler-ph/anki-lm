import Links from "./Links";
import LoginAndSignup from "./LoginAndSignup";
import Logo from "./Logo";

function NavBar() {
  return (
    <nav className="bg-gray-50 px-6 flex gap-4 justify-between fixed w-full h-20 items-center border-b border-gray-200 z-5">
      <Logo />
      <Links />
      <LoginAndSignup />
    </nav>
  );
}

export default NavBar;
