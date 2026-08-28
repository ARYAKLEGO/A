import { Dices, Search, X } from "lucide-react";

const SAMPLE_NAMES = ["Builderman", "ZyxCode99", "ShadowRunner_x", "PixelQueen", "Nova_Byte", "Cr1msonWolf"];

export default function SearchBar({
  value,
  onChange,
  onRandom,
}: {
  value: string;
  onChange: (v: string) => void;
  onRandom: () => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 pl-4 shadow-lg shadow-black/30 backdrop-blur-xl transition focus-within:border-cyan-400/50 focus-within:bg-white/[0.06]">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
          placeholder="Ketik username Roblox untuk dipindai..."
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={24}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
            aria-label="Bersihkan"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onRandom()}
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-fuchsia-400/40 hover:text-fuchsia-300 sm:flex"
        >
          <Dices className="h-3.5 w-3.5" /> Acak
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>Contoh: {SAMPLE_NAMES[Math.floor(Date.now() / 60000) % SAMPLE_NAMES.length]}</span>
        <span>{value.length}/20</span>
      </div>
    </div>
  );
}

export { SAMPLE_NAMES };
