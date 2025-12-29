import Popover from "./Popover";

const colors = {
  processed: "bg-green-100 text-green-800 border-green-300",
  preparing: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

function StatusChip(
  { lecture }: {
    lecture: {
      lid: number;
      status: "processed" | "preparing";
      transcriptions?: {
        name: string;
        content: React.ComponentType<unknown>;
      }[];
      numbered?: string[];
    };
  },
) {
  return (
    <>
      <div className="mt-4 font-semibold">II.3: Status</div>

      <span
        className={`rounded-sm px-2 py-1 text-xs font-semibold border ${
          colors[lecture.status]
        }`}
      >
        {lecture.status}
      </span>

      <div>
        {lecture.status === "processed" && lecture.transcriptions && (
          <div className="mt-2 text-sm">
            <span className="font-semibold">Transkriptionen:</span>
            <ul className="list-disc list-inside">
              {lecture.transcriptions.map((Comp, index) => (
                <li key={index}>
                  <Popover
                    lid={lecture.lid}
                    type={Comp.name}
                    Content={Comp.content}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        {lecture.status === "processed" && lecture.numbered && (
          <div className="mt-2 text-sm">
            <span className="font-semibold">Transkriptionen:</span>
            <ul className="list-disc list-inside">
              {lecture.numbered.map((file, index) => (
                <li key={index}>
                  <a
                    href={"/dir-praxis/" + file}
                    className="text-indigo-600 underline"
                  >
                    {file}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {lecture.status === "processed" &&
        (lecture.transcriptions || lecture.numbered) && (
        <button className="mt-4 rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
          Zwischenspeicher löschen
        </button>
      )}
    </>
  );
}

export default StatusChip;
