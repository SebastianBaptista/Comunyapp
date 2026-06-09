import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Lock, Calendar, Sparkle, Star } from "lucide-react";

export interface UserAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  xp_reward: number;
  icon_url: string | null;
  obtained_at: string;
  metadata?: Record<string, unknown> | null;
}

interface Props {
  achievements: UserAchievement[];
  loading?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AchievementIcon({ iconUrl, name, size = 20 }: { iconUrl: string | null; name: string; size?: number }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "block");
        }}
      />
    );
  }
  return <Star size={size} className="text-amber-500" strokeWidth={2.25} />;
}

export default function ProfileAchievements({ achievements, loading = false }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    achievements.length > 0 ? achievements[0].id : null
  );

  const selected = achievements.find((a) => a.id === selectedId) ?? achievements[0] ?? null;

  if (loading) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 bg-slate-100 rounded w-40" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-slate-100" />
              <div className="w-10 h-2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (achievements.length === 0) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-amber-500" />
          Mis Logros & Insignias
        </h3>
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-600">Aún no tienes logros</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Completa lecciones, crea posts y participa en la comunidad para desbloquear insignias.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Trophy size={20} className="text-amber-500" />
          Mis Logros & Insignias
        </h3>
        <span className="text-xs font-bold text-slate-500">
          {achievements.length} {achievements.length === 1 ? "Desbloqueado" : "Desbloqueados"}
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <AnimatePresence mode="popLayout">
          {achievements.map((ach) => {
            const isSelected = selectedId === ach.id;
            return (
              <motion.div
                layout
                key={ach.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedId(ach.id)}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 shadow-md ring-4 ring-indigo-500/20"
                      : "border-transparent bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-amber-500/40 bg-amber-500/10">
                    <AchievementIcon iconUrl={ach.icon_url} name={ach.name} size={20} />
                  </div>

                  {isSelected && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-1 -right-1 text-amber-400 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"
                    >
                      <Sparkle size={10} className="fill-amber-400" />
                    </motion.div>
                  )}
                </div>

                <span
                  className={`text-[10px] font-black text-center leading-tight tracking-tight transition-colors ${
                    isSelected ? "text-indigo-600" : "text-slate-700"
                  }`}
                >
                  {ach.name}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selected Detail Panel */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
          >
            {/* Large Icon */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mx-auto sm:mx-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-amber-500/40 bg-amber-500/10">
                <AchievementIcon iconUrl={selected.icon_url} name={selected.name} size={28} />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h4 className="text-sm font-black text-slate-800">{selected.name}</h4>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider mx-auto sm:mx-0 w-fit">
                  +{selected.xp_reward} XP
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                {selected.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-bold text-slate-500">
                <Calendar size={12} className="text-indigo-500" />
                <span>Desbloqueado el {formatDate(selected.obtained_at)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
