import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";

export type CheckState = "idle" | "invalid" | "checking" | "available" | "taken" | "error";

const CONFIG: Record<
  Exclude<CheckState, "idle">,
  { icon: React.ReactNode; text: string; classes: string }
> = {
  invalid: {
    icon: <ShieldAlert className="h-5 w-5" />,
    text: "Format username tidak valid",
    classes: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  checking: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    text: "Memindai database Roblox secara real-time...",
    classes: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  available: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    text: "Tersedia — username ini belum digunakan siapa pun",
    classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  taken: {
    icon: <XCircle className="h-5 w-5" />,
    text: "Sudah digunakan — akun ditemukan",
    classes: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
  error: {
    icon: <AlertTriangle className="h-5 w-5" />,
    text: "Gagal terhubung ke server Roblox, coba lagi",
    classes: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  },
};

export default function StatusBanner({ state }: { state: CheckState }) {
  return (
    <AnimatePresence mode="wait">
      {state !== "idle" && (
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur ${CONFIG[state].classes}`}
        >
          {CONFIG[state].icon}
          <span>{CONFIG[state].text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
