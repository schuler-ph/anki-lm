const colors = {
  processed: "bg-green-100 text-green-800 border border-green-300",
  preparing: "bg-yellow-100 text-yellow-800 border border-yellow-300",
};

function StatusChip({ status }: { status: "processed" | "preparing" }) {
  return (
    <>
      <div className="mt-4 font-semibold">II.3: Status</div>

      <span
        className={`rounded-sm px-2 py-1 text-xs font-semibold ${
          colors[status]
        }`}
      >
        {status}
      </span>
    </>
  );
}

export default StatusChip;
