import { Link } from "react-router-dom";
import Button from "../Button";

function ContactForm() {
  return (
    <>
      <form className="flex flex-col gap-4" id="contactForm">
        <div className="flex flex-col">
          <label htmlFor="contactName">Name</label>
          <input
            required
            className="p-2 border rounded-sm border-gray-200"
            id="contactName"
            type="text"
            placeholder="Ihr Name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="contactEmail">E-Mail</label>
          <input
            required
            className="p-2 border rounded-sm border-gray-200"
            id="contactEmail"
            type="email"
            placeholder="Ihre E-Mail"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="contactSubject">Betreff</label>
          <input
            required
            className="p-2 border rounded-sm border-gray-200"
            id="contactSubject"
            type="text"
            placeholder="Betreff"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="contactMessage">Nachricht</label>
          <textarea
            required
            id="contactMessage"
            placeholder="Ihre Nachricht"
            rows={5}
            className="p-2 border rounded-sm border-gray-200"
          >
          </textarea>
        </div>

        <label htmlFor="contactAgreement" className="text-xs">
          <input
            required
            type="checkbox"
            id="contactAgreement"
            className="mr-4"
          />
          Ich stimme zu, dass meine Angaben zur Kontaktaufnahme und für
          Rückfragen dauerhaft gespeichert werden. Ich kann diese Einwilligung
          jederzeit widerrufen. (Siehe{" "}
          {
            <Link to="/privacy" className="text-indigo-600 underline">
              Datenschutzerklärung
            </Link>
          })
        </label>

        <Button
          name="Absenden"
          type="submit"
          onClick={() => {
            const form = document.getElementById(
              "contactForm",
            ) as HTMLFormElement;
            if (form.checkValidity()) {
              alert(
                "Vielen Dank für Ihre Nachricht! Wir werden uns so schnell wie möglich bei Ihnen melden.",
              );
              form.reset();
            }
          }}
        />
      </form>
    </>
  );
}

export default ContactForm;
