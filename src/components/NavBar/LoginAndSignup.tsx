import Button from "../Button";
import { useAuth } from "../../context/AuthContext";

function LoginAndSignup({
  stacked = false,
  onAction,
}: {
  stacked?: boolean;
  onAction?: () => void;
}) {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return null;

  const wrapper = stacked
    ? "flex flex-col gap-3 items-stretch"
    : "flex gap-3 items-center";

  if (user) {
    return (
      <div className={wrapper}>
        <Button
          to="/app"
          name={user.user_metadata.full_name as string}
          variant="ghost"
          onClick={onAction}
        />
        <Button
          onClick={() => {
            signOut();
            onAction?.();
          }}
          name="Abmelden"
          variant="secondary"
        />
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <Button
        onClick={() => {
          signIn();
          onAction?.();
        }}
        name="Mit Google anmelden"
        variant="secondary"
      />
      <Button to="/demo" name="Free Demo" onClick={onAction} />
    </div>
  );
}

export default LoginAndSignup;
