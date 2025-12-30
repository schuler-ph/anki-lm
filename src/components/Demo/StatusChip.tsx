import type { Lecture } from "./types";

const statusStyles = {
  processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  preparing: "bg-amber-100 text-amber-800 border-amber-200",
};

const statusLabels = {
  processed: "Verarbeitung abgeschlossen",
  preparing: "Warte auf Input",
};

function StatusChip({ lecture }: { lecture: Lecture }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          statusStyles[lecture.status as keyof typeof statusStyles]
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            lecture.status === "processed" ? "bg-emerald-500" : "bg-amber-500"
          }`}
        >
        </span>
        {statusLabels[lecture.status as keyof typeof statusLabels]}
      </span>

      {
        /* Transkripte sind hier optional als kleines Icon oder Dropdown denkbar,
          aber der Einfachheit halber lassen wir die Details im Popover oder hier drunter */
      }
    </div>
  );
}

export default StatusChip;
