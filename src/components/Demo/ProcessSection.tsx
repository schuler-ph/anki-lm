function ProcessSection(
  { lecture }: {
    lecture: {
      status: string;
      lid: number;
      results?: {
        summary: React.ComponentType<unknown>;
        veredelt: React.ComponentType<unknown>;
        tldr: React.ComponentType<unknown>;
        konzepte: React.ComponentType<unknown>;
        beispiele: React.ComponentType<unknown>;
        anki: React.ComponentType<unknown>;
      };
    };
  },
) {
  return (
    <>
      <h2 className="font-semibold pt-6">II.4: Verarbeitung</h2>

      {lecture.status === "preparing"
        ? (
          <button className="rounded-sm bg-indigo-200 hover:bg-indigo-400 px-2 py-1 cursor-pointer mt-4">
            Verarbeitung starten
          </button>
        )
        : lecture.results === undefined
        ? <>Keine Ergebnisse</>
        : (
          <>
            <button
              popoverTarget={`popover-summary-${lecture.lid}`}
              popoverTargetAction="show"
            >
              Toggle the popover
            </button>
            <div
              id={`popover-summary-${lecture.lid}`}
              popover="auto"
              className="fixed inset-0 mx-auto mt-5 h-full overscroll-contain bg-white p-4 shadow-xl rounded-lg border-none"
            >
              <article className="prose pb-10">
                <lecture.results.summary />
              </article>
            </div>
          </>
        )}
    </>
  );
}

export default ProcessSection;
