import { motion } from "framer-motion";
import { BadgeCheck, Sparkles } from "lucide-react";
import type { RobloxSearchResult } from "../lib/roblox";

export default function SimilarUsers({
  users,
  onPick,
}: {
  users: RobloxSearchResult[];
  onPick: (name: string) => void;
}) {
  if (!users.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Akun dengan nama mirip
      </p>
      <div className="flex flex-wrap gap-2">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onPick(u.name)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-violet-200"
          >
            @{u.name}
            {u.hasVerifiedBadge && <BadgeCheck className="h-3 w-3 text-cyan-400" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
