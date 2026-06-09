import React from "react";
import { BookOpen, Flame, Trophy, Users } from "lucide-react";
import { PROFILE_STATS } from "../data/profileMock";

const iconMap = {
  flame: Flame,
  users: Users,
  book: BookOpen,
  trophy: Trophy,
};

interface Props {
  badgeCount?: number;
}

export default function ProfileStatsGrid({ badgeCount }: Props) {
  const stats = PROFILE_STATS.map((s) =>
    s.label === "Insignias" && badgeCount !== undefined
      ? { ...s, value: String(badgeCount) }
      : s
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        return (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-3xl p-5 flex flex-col items-center text-center shadow-sm border border-white/60`}
          >
            <div className={`mb-3 ${stat.iconColor}`}>
              <Icon size={22} strokeWidth={2.25} />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
            <p className="text-[11px] font-bold text-slate-600 mt-2 leading-tight">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
