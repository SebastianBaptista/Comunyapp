import React from "react";
import { PROFILE_RANKING } from "../data/profileMock";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileRanking() {
  const { user } = useAuth();

  const ranking = PROFILE_RANKING.map((entry) =>
    entry.isYou
      ? {
          ...entry,
          name: `${user?.name?.split(" ")[0] ?? "Tú"} C. (Tú)`,
          avatar: user?.avatar || entry.avatar,
        }
      : entry
  );

  return (
    <section className="rounded-3xl bg-sky-50/90 border border-sky-100 p-5">
      <h3 className="text-lg font-black text-slate-900 mb-4">Ranking semanal</h3>

      <div className="space-y-2">
        {ranking.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              entry.isYou
                ? "bg-violet-500 text-white shadow-lg shadow-violet-200/60"
                : "bg-white text-slate-800"
            }`}
          >
            <span
              className={`w-7 text-center font-black text-sm ${entry.isYou ? "text-white/90" : "text-slate-400"}`}
            >
              #{entry.rank}
            </span>
            <img
              src={entry.avatar}
              alt=""
              className={`w-9 h-9 rounded-full object-cover border-2 ${entry.isYou ? "border-white/40" : "border-slate-100"}`}
            />
            <span className={`flex-1 font-bold text-sm truncate ${entry.isYou ? "text-white" : "text-slate-800"}`}>
              {entry.name}
            </span>
            <span className={`text-xs font-bold ${entry.isYou ? "text-white/90" : "text-slate-500"}`}>
              {entry.xp}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
