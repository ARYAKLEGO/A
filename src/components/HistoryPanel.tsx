import { motion } from "framer-motion";
import { History, Trash2 } from "lucide-react";

export interface HistoryEntry {
  username: string;
  status: "available" | "taken";
  time: number;
}

export default function HistoryPanel({
  history,
  onPick,
  onClear,
}: {
  history: HistoryEntry[];
  onPick: (name: string) => void;
  onClear: () => void;
}) {
  if (!history.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <History className="h-3.5 w-3.5 text-cyan-400" /> Riwayat Pencarian
        </p>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-rose-400"
        >
          <Trash2 className="h-3 w-3" /> Bersihkan
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((h) => (
          <button
            key={`${h.username}-${h.time}`}
            onClick={() => onPick(h.username)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              h.status === "available"
                ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/10"
                : "border-rose-400/20 bg-rose-400/5 text-rose-300 hover:bg-rose-400/10"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                h.status === "available" ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            @{h.username}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
