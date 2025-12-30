import Logo from "../NavBar/Logo";
import FooterColumn from "./FooterColumn";

const productItems = [{
  title: "Preise",
  link: "pricing",
}, {
  title: "FAQ",
  link: "faq",
}];

const companyItems = [
  { title: "About us", link: "about" },
  { title: "Praxis", link: "practice" },
];

const legalItems = [
  { title: "Erklärung zur Barrierefreiheit", link: "accessibility" },
  { title: "Kontakt & Impressum", link: "contact" },
  { title: "AGBs & Lizenz", link: "terms" },
  { title: "Datenschutz", link: "privacy" },
];

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="grid grid-cols-12 gap-12 p-6">
        <div className="col-span-3 flex-row">
          <Logo />
          <p className="font-light mt-4">
            Wandle komplizierten Stoff in einfach verständliches Lernmaterial
            um.
          </p>
        </div>
        <div className="col-span-8 col-start-5">
          <div className="grid grid-cols-3 gap-12">
            <FooterColumn title="Produkt" items={productItems} />
            <FooterColumn title="Unternehmen" items={companyItems} />
            <FooterColumn title="Rechtliches" items={legalItems} />
          </div>
        </div>
      </div>
      <div className="mx-4 mt-4 border-t border-gray-200 p-6 text-sm text-gray-500">
        © 2025 AnkiLM. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
