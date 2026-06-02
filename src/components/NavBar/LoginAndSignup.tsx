import Button from "../Button";
import { useAuth } from "../../context/AuthContext";

function LoginAndSignup() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex gap-3 items-center">
        <Button
          to="/app"
          name={user.user_metadata.full_name as string}
          variant="ghost"
        />
        <Button onClick={signOut} name="Abmelden" variant="secondary" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-center">
      <Button onClick={signIn} name="Mit Google anmelden" variant="secondary" />
      <Button to="/demo" name="Free Demo" />
    </div>
  );
}

export default LoginAndSignup;
