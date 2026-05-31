import type { JobStatus } from "./types";

const statusStyles: Record<JobStatus, string> = {
  preparing: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<JobStatus, string> = {
  preparing: "Warte auf Input",
  processing: "In Bearbeitung...",
  processed: "Verarbeitung abgeschlossen",
  failed: "Fehler",
};

const dotColor: Record<JobStatus, string> = {
  preparing: "bg-amber-500",
  processing: "bg-blue-500 animate-pulse",
  processed: "bg-emerald-500",
  failed: "bg-red-500",
};

function StatusChip({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor[status]}`} />
      {statusLabels[status]}
    </span>
  );
}

export default StatusChip;
