import Button from "../../components/Button";

function NotFound() {
  return (
    <div>
      <h1>404 - Seite nicht gefunden</h1>
      <Button to="/" name="Zur Startseite" />
    </div>
  );
}

export default NotFound;
