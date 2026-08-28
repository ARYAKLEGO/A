import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radar, ShieldCheck, Sparkles, GitBranch } from "lucide-react";

import BackgroundFX from "./components/BackgroundFX";
import SearchBar, { SAMPLE_NAMES } from "./components/SearchBar";
import RuleChecklist from "./components/RuleChecklist";
import StatusBanner, { type CheckState } from "./components/StatusBanner";
import ProfileCard from "./components/ProfileCard";
import SimilarUsers from "./components/SimilarUsers";
import HistoryPanel, { type HistoryEntry } from "./components/HistoryPanel";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getUsernameRuleChecks, isUsernameFormatValid, lookupUsername, type LookupResult } from "./lib/roblox";

export default function App() {
  const [raw, setRaw] = useState("");
  const debounced = useDebouncedValue(raw.trim(), 500);
  const [state, setState] = useState<CheckState>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>("rbx-detector-history", []);
  const requestRef = useRef(0);

  const rules = useMemo(() => getUsernameRuleChecks(debounced), [debounced]);

  useEffect(() => {
    const id = ++requestRef.current;

    if (!debounced) {
      setState("idle");
      setResult(null);
      return;
    }

    if (!isUsernameFormatValid(debounced)) {
      setState("invalid");
      setResult(null);
      return;
    }

    setState("checking");

    lookupUsername(debounced)
      .then((res) => {
        if (requestRef.current !== id) return;
        setResult(res);
        setState(res.status);
        setHistory((prev) => {
          const next: HistoryEntry[] = [
            { username: debounced, status: res.status, time: Date.now() },
            ...prev.filter((h) => h.username.toLowerCase() !== debounced.toLowerCase()),
          ].slice(0, 10);
          return next;
        });
      })
      .catch(() => {
        if (requestRef.current !== id) return;
        setState("error");
        setResult(null);
      });
  }, [debounced, setHistory]);

  const handleRandom = () => {
    const pick = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    setRaw(pick);
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      <BackgroundFX />

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-10 pt-8 sm:px-6">
        {/* header */}
        <header className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 shadow-lg shadow-cyan-500/10"
          >
            <Radar className="h-8 w-8 text-cyan-300" />
          </motion.div>
          <h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Roblox Username Detector
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-400">
            Cek ketersediaan & lacak detail akun Roblox secara <span className="text-cyan-300">real-time</span> —
            langsung dari data publik Roblox.
          </p>
          <div className="mt-3 flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live scanning aktif
          </div>
        </header>

        {/* search */}
        <SearchBar value={raw} onChange={setRaw} onRandom={handleRandom} />

        <div className="mt-4">
          <StatusBanner state={state} />
        </div>

        {debounced && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Validasi Format Username
            </p>
            <RuleChecklist rules={rules} />
          </div>
        )}

        <div className="mt-5 space-y-5">
          <AnimatePresence mode="wait">
            {state === "taken" && result?.profile && (
              <motion.div key="taken" exit={{ opacity: 0 }}>
                <ProfileCard profile={result.profile} />
              </motion.div>
            )}

            {state === "available" && (
              <motion.div
                key="available"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-8 text-center"
              >
                <Sparkles className="h-10 w-10 text-emerald-400" />
                <p className="text-lg font-bold text-white">@{debounced} bisa langsung dipakai!</p>
                <p className="max-w-sm text-sm text-slate-400">
                  Username ini tidak ditemukan di database Roblox manapun — kemungkinan besar tersedia untuk
                  didaftarkan.
                </p>
                <a
                  href="https://www.roblox.com/CreateAccount"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 rounded-full bg-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/30"
                >
                  Daftar di Roblox →
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {result && result.similar.length > 0 && <SimilarUsers users={result.similar} onPick={setRaw} />}

          <HistoryPanel history={history} onPick={setRaw} onClear={() => setHistory([])} />
        </div>

        <footer className="mt-auto pt-10 text-center text-[11px] leading-relaxed text-slate-600">
          <p>
            Alat tidak resmi (unofficial) yang mengambil data publik dari Roblox melalui proxy CORS. Bukan produk
            resmi Roblox Corporation.
          </p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <GitBranch className="h-3 w-3" /> Dibangun untuk dikemas menjadi APK via GitHub Actions + Capacitor.
          </p>
        </footer>
      </div>
    </div>
  );
}
