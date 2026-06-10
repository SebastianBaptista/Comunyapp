import React from "react";
import { Award } from "lucide-react";
import { PROFILE_LEVEL } from "../data/profileMock";

interface ProfileHeroProps {
  name: string;
  avatar?: string;
  subtitle?: string;
  levelIcon?: string;
  onEdit: () => void;
}

export default function ProfileHero({ name, avatar, subtitle, levelIcon, onEdit }: ProfileHeroProps) {
  const displaySubtitle =
    subtitle?.trim() || `${PROFILE_LEVEL.subtitle} • Nivel ${PROFILE_LEVEL.level}`;

  return (
    <section>
      {/* Banner */}
      <div className="relative h-36 sm:h-40 overflow-hidden rounded-b-[2rem]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500" />
        <svg
          className="absolute inset-0 w-full h-full opacity-90"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,80 C80,20 160,120 240,60 C300,20 360,100 400,40 L400,160 L0,160 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <path
            d="M0,100 C100,40 200,130 320,70 C360,50 380,90 400,80 L400,160 L0,160 Z"
            fill="rgba(0,0,0,0.08)"
          />
        </svg>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center -mt-14 px-4 pb-2 relative z-10">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-violet-50">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-violet-600 font-black text-4xl bg-violet-100">
                {name[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-violet-500 border-[3px] border-white flex items-center justify-center text-white shadow-md overflow-hidden">
            {levelIcon ? (
              <img src={levelIcon} alt="Nivel" className="w-full h-full object-cover" />
            ) : (
              <Award size={16} strokeWidth={2.5} />
            )}
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 text-center">{displaySubtitle}</p>

        <div className="mt-5 w-full max-w-xs">
          <button
            type="button"
            onClick={onEdit}
            className="w-full py-3 rounded-2xl bg-[#ae3df7] text-white text-sm font-bold shadow-md shadow-violet-950/10 hover:bg-[#921be2] active:scale-[0.98] transition-all"
          >
            Editar perfil
          </button>
        </div>
      </div>
    </section>
  );
}
