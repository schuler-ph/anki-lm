import { Link } from "react-router-dom";

function Imprint() {
  return (
    <>
      <p className="text-xs">
        Informationspflicht laut § 5 E-Commerce Gesetz, § 14
        Unternehmensgesetzbuch, § 63 Gewerbeordnung und Offenlegungspflicht laut
        § 25 Mediengesetz.
      </p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">
        Medieninhaber & Herausgeber
      </h3>
      <p className="text-sm font-semibold">AnkiLM GmbH</p>
      <p className="text-sm">
        Unternehmenssitz: Resselgasse 3, 1040 Wien, Österreich
      </p>
      <p className="text-sm">Telefon: +43 1 12345678</p>
      <p className="text-sm">Web: www.ankilm.at</p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">Kontakt</h3>
      <p className="text-sm">Allgemeine Anfragen: office@ankilm.at</p>
      <p className="text-sm">Beschwerden: beschwerde@ankilm.at</p>
      <p className="text-sm">Datenschutz: datenschutz@ankilm.at</p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">Unternehmensdaten</h3>
      <p className="text-sm">Sitz der Gesellschaft: Wien</p>
      <p className="text-sm">
        Rechtsform: Gesellschaft mit beschränkter Haftung (GmbH)
      </p>
      <p className="text-sm">
        Firmenbuchnummer: FN 123456x / Handelsgericht Wien
      </p>
      <p className="text-sm">Geschäftsführer: Philipp Schuler</p>
      <p className="text-sm">UID-Nummer: ATU12345678</p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">
        Ausgeübte Gewerbe & Vorschriften
      </h3>
      <p className="text-sm font-semibold">
        Unternehmensgegenstand (Gewerbewortlaut):
      </p>
      <p className="text-sm">
        Dienstleistungen in der automatischen Datenverarbeitung und
        Informationstechnik. Entwicklung und Vertrieb von Software für
        Bildungszwecke.
      </p>

      <p className="text-sm font-semibold mt-2 mb-1">
        Kammerzugehörigkeit:
      </p>
      <p className="text-sm">
        Mitglied der Wirtschaftskammer Österreich (WKO), Fachgruppe
        Unternehmensberatung, Buchhaltung und Informationstechnologie (UBIT).
      </p>

      <p className="text-sm font-semibold mt-2 mb-1">
        Anwendbare Rechtsvorschriften:
      </p>
      <p className="text-sm">
        Gewerbeordnung (GewO), E-Commerce-Gesetz (ECG), Mediengesetz (MedG).
        Zugänglich unter:{" "}
        <Link
          to="https://www.ris.bka.gv.at"
          className="text-indigo-600 underline"
        >
          www.ris.bka.gv.at
        </Link>
      </p>

      <p className="text-sm font-semibold mt-2 mb-1">
        Aufsichtsbehörde / Gewerbebehörde:
      </p>
      <p className="text-sm">
        Magistrat der Stadt Wien
      </p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">
        Offenlegung gemäß § 25 Mediengesetz
      </h3>
      <p className="text-sm font-semibold mt-2 mb-1">
        Blattlinie (Grundlegende Richtung):
      </p>
      <p className="text-sm">
        Die Website und der Webshop dienen der Information über die Produkte und
        Dienstleistungen der AnkiLM GmbH sowie der Förderung von effizienten
        Lernmethoden durch den Einsatz künstlicher Intelligenz.
      </p>

      <h3 className="font-semibold mt-4 mb-2 text-lg">Haftungsausschluss</h3>
      <p className="text-sm">
        AnkiLM übernimmt keine Haftung für den Inhalt extern verlinkter
        Webseiten. Alle Inhalte auf dieser Plattform werden mit Sorgfalt
        gestaltet. Da unsere Dienste jedoch auf generativer Künstlicher
        Intelligenz basieren, übernimmt AnkiLM keine Gewährleistung für die
        inhaltliche Richtigkeit (z.B. Halluzinationen) der generierten
        Lernmaterialien. Jegliche Nutzung der Inhalte erfolgt auf eigene
        Verantwortung. Prinzipiell sollte jedes erstellte Lernmaterial vor der
        Verwendung überprüft und eigenständig nachbearbeitet werden.
      </p>

      <p className="text-sm mt-4 mb-2">
        Bitte beachten Sie auch unsere{" "}
        <Link to="/terms" className="text-indigo-600 underline">
          Allgemeinen Geschäftsbedingungen
        </Link>{" "}
        und{" "}
        <Link to="/privacy" className="text-indigo-600 underline">
          Datenschutz-Informationen
        </Link>.
      </p>
    </>
  );
}

export default Imprint;
