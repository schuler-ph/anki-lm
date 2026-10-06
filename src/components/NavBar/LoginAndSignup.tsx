import Button from "../Button";

function LoginAndSignup({
  stacked = false,
  onAction,
}: {
  stacked?: boolean;
  onAction?: () => void;
}) {
  const wrapper = stacked
    ? "flex flex-col gap-3 items-stretch"
    : "flex gap-3 items-center";

  return (
    <div className={wrapper}>
      <Button to="/demo" name="Free Demo" onClick={onAction} />
    </div>
  );
}

export default LoginAndSignup;
