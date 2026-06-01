import Button from "../Button";
import { useAuth } from "../../context/AuthContext";

function LoginAndSignup() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-600 hidden sm:block">{user.user_metadata.full_name as string}</span>
        <Button onClick={signOut} name="Abmelden" variant="secondary" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Button onClick={signIn} name="Mit Google anmelden" variant="secondary" />
      <Button to="/demo" name="Free Demo" />
    </div>
  );
}

export default LoginAndSignup;
