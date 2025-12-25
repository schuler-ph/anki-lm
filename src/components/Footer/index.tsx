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
  { title: "Datenschutz", link: "privacy" },
  { title: "Impressum", link: "imprint" },
  { title: "About", link: "about" },
  { title: "AGBs", link: "terms" },
];

const socialItems = [
  { title: "Facebook", link: "https://facebook.com/schuler.ph" },
  {
    title: "Twitter",
    link: "https://twitter.com/schuler_ph",
  },
  { title: "Github", link: "https://github.com/schuler-ph" },
];

function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className="grid grid-cols-12 gap-12 p-6">
        <div className="col-span-3 flex-row">
          <Logo />
          <p>
            Wandle komplizierten Stoff in einfach verständliches Lernmaterial
            um.
          </p>
        </div>
        <div className="col-span-8 col-start-5">
          <div className="grid grid-cols-3 gap-12">
            <FooterColumn title="Produkt" items={productItems} />
            <FooterColumn title="Unternehmen" items={companyItems} />
            <FooterColumn title="Soziales" items={socialItems} />
          </div>
        </div>
      </div>
      <div className="m-4 border-t border-gray-200 p-6 text-sm text-gray-500">
        © 2025 AnkiLM. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
