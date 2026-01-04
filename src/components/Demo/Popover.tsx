function Popover({
  lid,
  type,
  label, // Neues Label Prop für schöneren Text
  Content,
}: {
  lid: number;
  type: string;
  label?: string;
  Content: React.ComponentType<unknown>;
}) {
  const displayLabel = label || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <>
      {/* Wir nutzen hier einen 100% breiten Button für das Grid */}
      <button
        popoverTarget={`popover-${type}-${lid}`}
        popoverTargetAction="show"
        className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center h-full group"
      >
        <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">
          {displayLabel}
        </span>
        <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-wide">
          Anzeigen
        </span>
      </button>

      <div
        id={`popover-${type}-${lid}`}
        popover="auto"
        className="fixed inset-0 m-auto w-full max-w-3xl h-[80vh] bg-white rounded-xl shadow-2xl p-0 overflow-hidden backdrop:bg-gray-900/50"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">{displayLabel}</h3>
        </div>
        <div className="p-8 overflow-y-auto h-full pb-20 prose max-w-none">
          <Content />
        </div>
      </div>
    </>
  );
}

export default Popover;
