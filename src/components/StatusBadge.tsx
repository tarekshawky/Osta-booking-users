const STYLES: Record<string, string> = {
  // orders
  Requested: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  Assigned: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  "On The Way": "bg-sky-400/15 text-sky-300 border-sky-400/30",
  "In Progress": "bg-sky-400/15 text-sky-300 border-sky-400/30",
  Done: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Cancelled: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  Rescheduled: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  // invoices
  Paid: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Unpaid: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  Refunded: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  Partial: "bg-amber-400/15 text-amber-300 border-amber-400/30",
};

const DEFAULT_STYLE = "bg-slate-400/15 text-slate-300 border-slate-400/30";

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] || DEFAULT_STYLE;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${style}`}>
      {status}
    </span>
  );
}
