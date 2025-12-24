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
  { title: "About", link: "about" },
  { title: "Datenschutz", link: "privacy" },
  { title: "AGBs", link: "terms" },
  { title: "Impressum", link: "imprint" },
];

const socialItems = [
  { title: "Github", link: "https://github.com/schuler-ph" },
  {
    title: "Twitter",
    link: "https://twitter.com/schuler_ph",
  },
  { title: "Facebook", link: "https://facebook.com/schuler.ph" },
];

function Footer() {
  return (
    <div className="border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 p-6">
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
    </div>
  );
}

export default Footer;
