import { HashRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Article from "./components/Article";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./content/home.mdx";
import Prices from "./content/prices.mdx";
import Demo from "./pages/Demo";
import Faq from "./content/faq.mdx";

import Contact from "./content/contact.mdx";
import About from "./content/about.mdx";

import Accessibility from "./content/accessibility.mdx";
import Terms from "./content/terms.mdx";
import PrivacyPolicy from "./content/privacy.mdx";

import NotFound from "./content/notFound.mdx";

function Layout() {
  return (
    <HashRouter>
      <ScrollToTop />
      <NavBar />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Article Content={Home} />} />
          <Route path="/prices" element={<Article Content={Prices} />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/faq" element={<Article Content={Faq} />} />

          <Route path="/contact" element={<Article Content={Contact} />} />
          <Route path="/about" element={<Article Content={About} />} />

          <Route path="/accessibility" element={<Article Content={Accessibility} />}/>
          <Route path="/terms" element={<Article Content={Terms} />} />
          <Route path="/privacy" element={<Article Content={PrivacyPolicy} />} />

          <Route path="*" element={<Article Content={NotFound} />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </HashRouter>
  );
}

export default Layout;
