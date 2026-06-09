import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  BookOpen,
  GraduationCap,
  Pencil,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Award,
  HelpCircle,
} from "lucide-react";
import { XP_BREAKDOWN } from "../data/profileMock";

const actionIconMap = {
  book: BookOpen,
  graduation: GraduationCap,
  pencil: Pencil,
  heart: Heart,
  message: MessageSquare,
  flame: Flame,
};

interface Props {
  level: number;
  xpCurrent: number;
  xpNext: number;
  tierName?: string;
  tierDescription?: string;
  loading?: boolean;
}

export default function ProfileLevelCard({
  level,
  xpCurrent,
  xpNext,
  tierName,
  tierDescription,
  loading = false,
}: Props) {
  const [showXpInfo, setShowXpInfo] = useState(false);
  const progress = xpNext > 0 ? Math.min(Math.round((xpCurrent / xpNext) * 100), 100) : 0;
  const xpToNext = Math.max(xpNext - xpCurrent, 0);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 shadow-xl border border-slate-800/80 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-800 rounded-full w-32" />
          <div className="w-14 h-14 bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-6 bg-slate-800 rounded w-48 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-40 mb-5" />
        <div className="h-3.5 bg-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 shadow-xl border border-slate-800/80">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">
            Nivel del Usuario
          </span>
        </div>

        {/* Glowing Level Badge */}
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">LVL</span>
            <span className="text-xl font-black leading-none text-white tabular-nums mt-0.5">
              {level}
            </span>
          </div>
        </div>
      </div>

      {/* Title & XP Progress Summary */}
      <div className="relative z-10">
        <h3 className="text-xl font-black tracking-tight text-white">
          {tierName || `Nivel ${level}`}
        </h3>
        <p className="text-xs font-medium text-slate-300 mt-1">
          Faltan <span className="font-bold text-indigo-400">{xpToNext.toLocaleString()} XP</span>{" "}
          para subir al nivel <span className="font-bold text-pink-400">{level + 1}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 relative z-10">
        <div className="h-3.5 rounded-full bg-slate-800/80 p-[2px] border border-slate-700/50 shadow-inner overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-black tracking-wider text-slate-400 tabular-nums">
          <span>{xpCurrent.toLocaleString()} XP</span>
          <span className="text-indigo-300">{progress}%</span>
          <span>{xpNext.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Tier info */}
      {tierDescription && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu Rango</p>
            <p className="text-xs font-bold text-slate-200 mt-0.5">{tierName}</p>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{tierDescription}</p>
          </div>
        </div>
      )}

      {/* XP Breakdown Accordion */}
      <button
        type="button"
        onClick={() => setShowXpInfo(!showXpInfo)}
        className="w-full mt-4 flex items-center justify-between py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/20 rounded-xl px-2 transition-all relative z-10"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-400" />
          ¿Cómo ganar experiencia (XP)?
        </span>
        {showXpInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence initial={false}>
        {showXpInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden relative z-10"
          >
            <div className="pt-3 pb-1 border-t border-slate-800/80 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {XP_BREAKDOWN.map((item, idx) => {
                const Icon = actionIconMap[item.icon as keyof typeof actionIconMap] || HelpCircle;
                return (
                  <motion.div
                    key={idx}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Icon size={14} className="text-indigo-400" />
                      <span className="font-medium">{item.action}</span>
                    </div>
                    <span className="font-extrabold text-emerald-400 shrink-0 ml-2">{item.xp}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
