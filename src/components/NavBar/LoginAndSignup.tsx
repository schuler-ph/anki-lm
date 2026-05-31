import Button from "../Button";

function LoginAndSignup() {
  return (
    <div className="flex gap-2 items-center">
      <Button to="/app" name="Login" variant="secondary" />
      <Button to="/demo" name="Free Demo" />
    </div>
  );
}

export default LoginAndSignup;
