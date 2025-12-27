function Button(
  { name, popoverTarget, popoverTargetAction, type, onClick }: {
    name: string;
    popoverTarget?: string;
    popoverTargetAction?: "toggle" | "show" | "hide" | undefined;
    type?: "button" | "submit" | "reset" | undefined;
    onClick?: () => void;
  },
) {
  return (
    <button
      type={type}
      onClick={onClick}
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTargetAction}
      className="rounded-sm bg-indigo-200 hover:bg-indigo-600 hover:text-white transition-all px-2 py-1 cursor-pointer mr-2 mb-2"
    >
      {name}
    </button>
  );
}

export default Button;
