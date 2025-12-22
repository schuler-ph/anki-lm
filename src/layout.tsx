import { HashRouter, Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";

function Layout() {
  return (
    <HashRouter>
      <nav className="bg-gray-800 p-4 text-white flex gap-4">
        <Link to="/" className="hover:text-blue-300">Home</Link>
        <Link to="/about" className="hover:text-blue-300">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}

export default Layout;
