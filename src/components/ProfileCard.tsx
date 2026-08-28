import { motion } from "framer-motion";
import {
  BadgeCheck,
  Cake,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  ShieldBan,
  Users,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import type { FullRobloxProfile } from "../lib/roblox";
import { accountAge, formatDateID } from "../lib/roblox";
import CountUp from "./CountUp";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* noop */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
      title={label}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Disalin" : label}
    </button>
  );
}

export default function ProfileCard({ profile }: { profile: FullRobloxProfile }) {
  const { user, counts, avatarUrl } = profile;
  const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      {/* header */}
      <div className="relative flex flex-col gap-4 border-b border-white/10 bg-gradient-to-br from-rose-500/10 via-transparent to-cyan-500/10 p-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-slate-800 sm:h-24 sm:w-24">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-500">
                <Users className="h-8 w-8" />
              </div>
            )}
          </div>
          {user.hasVerifiedBadge && (
            <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-[#0a0e1a] p-0.5">
              <BadgeCheck className="h-6 w-6 text-cyan-400" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-xl font-bold text-white">{user.displayName}</h3>
            {user.isBanned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                <ShieldBan className="h-3 w-3" /> Dibanned
              </span>
            )}
          </div>
          <p className="truncate text-sm text-cyan-300/90">@{user.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyButton value={user.name} label="Username" />
            <CopyButton value={String(user.id)} label={`ID ${user.id}`} />
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <ExternalLink className="h-3 w-3" /> Buka Profil
            </a>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10 text-center">
        <div className="flex flex-col items-center gap-1 px-2 py-4">
          <UserCheck className="h-4 w-4 text-slate-400" />
          <span className="text-lg font-bold text-white">
            <CountUp value={counts.friends} />
          </span>
          <span className="text-[11px] text-slate-400">Teman</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-4">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-lg font-bold text-white">
            <CountUp value={counts.followers} />
          </span>
          <span className="text-[11px] text-slate-400">Pengikut</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-4">
          <UserPlus className="h-4 w-4 text-slate-400" />
          <span className="text-lg font-bold text-white">
            <CountUp value={counts.followings} />
          </span>
          <span className="text-[11px] text-slate-400">Mengikuti</span>
        </div>
      </div>

      {/* details */}
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
            <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">User ID</p>
              <p className="truncate font-mono text-sm text-slate-200">{user.id}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
            <Cake className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Bergabung</p>
              <p className="truncate text-sm text-slate-200">
                {formatDateID(user.created)}{" "}
                <span className="text-slate-500">· {accountAge(user.created)} lalu</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Bio / Deskripsi</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {user.description?.trim() ? user.description : "Pengguna ini belum menulis deskripsi apa pun."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
