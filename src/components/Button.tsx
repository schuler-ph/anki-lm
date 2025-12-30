function Button({
  name,
  popoverTarget,
  popoverTargetAction,
  type,
  onClick,
  disabled,
  variant = "primary", // Neuer Prop für Styling
}: {
  name: string;
  popoverTarget?: string;
  popoverTargetAction?: "toggle" | "show" | "hide" | undefined;
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const baseStyles =
    "rounded-md px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm",
    danger:
      "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-500",
    ghost:
      "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700",
  };

  return (
    <button
      disabled={disabled}
      type={type}
      onClick={onClick}
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTargetAction}
      className={`${baseStyles} ${variants[variant]} mr-2 mb-2`}
    >
      {name}
    </button>
  );
}

export default Button;