import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { UsernameRuleCheck } from "../lib/roblox";

export default function RuleChecklist({ rules }: { rules: UsernameRuleCheck[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rules.map((rule) => (
        <motion.div
          key={rule.id}
          layout
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
            rule.passed
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/[0.03] text-slate-400"
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              rule.passed ? "bg-emerald-400/20" : "bg-white/10"
            }`}
          >
            {rule.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          {rule.label}
        </motion.div>
      ))}
    </div>
  );
}
