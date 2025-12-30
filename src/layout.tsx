import { HashRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Demo from "./pages/Demo";

import Article from "./components/Article";
import Practice from "./content/praxis.mdx";
import PrivacyPolicy from "./content/privacy.mdx";
import Contact from "./content/contact.mdx";
import CookieBanner from "./components/CookieBanner";
import Accessibility from "./content/accessibility.mdx";

function Layout() {
  return (
    <HashRouter>
      <NavBar />
      <main className="pt-24 pb-4 px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />

          <Route path="/practice" element={<Article Content={Practice} />} />

          {/* accessibility */}

          <Route
            path="/accessibility"
            element={<Article Content={Accessibility} />}
          />
          <Route path="/contact" element={<Article Content={Contact} />} />
          <Route path="/license" element={<Article Content={Practice} />} />
          <Route
            path="/privacy"
            element={<Article Content={PrivacyPolicy} />}
          />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </HashRouter>
  );
}

export default Layout;
