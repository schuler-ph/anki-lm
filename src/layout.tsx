import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Demo from "./pages/Demo";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

function Layout() {
  return (
    <HashRouter>
      <NavBar />
      <main className="pt-24 pb-4 px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </HashRouter>
  );
}

export default Layout;
