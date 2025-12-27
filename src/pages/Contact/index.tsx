import ContactForm from "../../components/Contact/ContactForm";
import Imprint from "../../components/Contact/Imprint";

function Contact() {
  return (
    <>
      <h1 className="font-bold text-2xl">Kontakt & Impressum</h1>

      <h2 className="font-bold text-lg mt-8">Kontaktieren Sie uns</h2>
      <ContactForm />

      <h2 className="font-bold text-lg mt-8">Impressum</h2>
      <Imprint />
    </>
  );
}

export default Contact;
