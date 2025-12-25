function Button(
  { name, popoverTarget, popoverTargetAction }: {
    name: string;
    popoverTarget?: string;
    popoverTargetAction?: "toggle" | "show" | "hide" | undefined;
  },
) {
  return (
    <button
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTargetAction}
      className="rounded-sm bg-indigo-200 hover:bg-indigo-600 hover:text-white transition-all px-2 py-1 cursor-pointer mr-2 mb-2"
    >
      {name}
    </button>
  );
}

export default Button;
