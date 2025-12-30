import { HashRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Demo from "./pages/Demo";

import Article from "./components/Article";
import Home from "./content/home.mdx";
import Practice from "./content/praxis.mdx";
import PrivacyPolicy from "./content/privacy.mdx";
import Contact from "./content/contact.mdx";
import CookieBanner from "./components/CookieBanner";
import Accessibility from "./content/accessibility.mdx";
import About from "./content/about.mdx";
import NotFound from "./content/notFound.mdx";
import ScrollToTop from "./components/ScrollToTop";
import Terms from "./content/terms.mdx";

function Layout() {
  return (
    <HashRouter>
      <ScrollToTop />
      <NavBar />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Article Content={Home} />} />
          <Route path="/demo" element={<Demo />} />

          <Route path="/practice" element={<Article Content={Practice} />} />

          {/* accessibility */}

          <Route
            path="/accessibility"
            element={<Article Content={Accessibility} />}
          />
          <Route path="/contact" element={<Article Content={Contact} />} />
          <Route path="/license" element={<Article Content={Practice} />} />
          <Route path="/terms" element={<Article Content={Terms} />} />
          <Route
            path="/privacy"
            element={<Article Content={PrivacyPolicy} />}
          />
          <Route path="/about" element={<Article Content={About} />} />
          <Route path="*" element={<Article Content={NotFound} />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </HashRouter>
  );
}

export default Layout;
