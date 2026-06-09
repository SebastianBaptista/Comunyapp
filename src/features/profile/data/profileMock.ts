export const PROFILE_LEVEL = {
  level: 12,
  title: "Maestro del Caos",
  subtitle: "Explorador de Ideas",
  xpCurrent: 1260,
  xpTarget: 1500,
  xpToNext: 240,
  nextReward: {
    title: "Diseñador Élite",
    rewardText: "Desbloquea el título 'Creador Élite' y acceso a lecciones avanzadas de UI.",
  }
};

export const XP_BREAKDOWN = [
  { action: "Completar una lección", xp: "+50 XP", icon: "book" },
  { action: "Completar un curso entero", xp: "+200 XP", icon: "graduation" },
  { action: "Crear una publicación", xp: "+15 XP", icon: "pencil" },
  { action: "Recibir reacción en tu post", xp: "+5 XP", icon: "heart" },
  { action: "Dejar un comentario", xp: "+10 XP", icon: "message" },
  { action: "Mantener tu racha semanal", xp: "+100 XP", icon: "flame" },
];

export const PROFILE_STATS = [
  { label: "Días de Racha", value: "15", icon: "flame" as const, bg: "bg-violet-100", iconColor: "text-violet-600" },
  { label: "Impacto Social", value: "1.2k", icon: "users" as const, bg: "bg-amber-100", iconColor: "text-amber-600" },
  { label: "Lecciones", value: "48", icon: "book" as const, bg: "bg-violet-100", iconColor: "text-violet-600" },
  { label: "Insignias", value: "8", icon: "trophy" as const, bg: "bg-sky-100", iconColor: "text-sky-600" },
];

export const PROFILE_ACHIEVEMENTS = [
  {
    id: "pionero",
    label: "Pionero",
    icon: "rocket" as const,
    earned: true,
    category: "special",
    tier: "gold",
    description: "Miembro fundador que se unió en las primeras 24 horas del lanzamiento de la plataforma.",
    unlockedAt: "10 Ene 2026",
    ring: "ring-violet-200",
    bg: "bg-violet-50",
    color: "text-violet-500"
  },
  {
    id: "creativo",
    label: "Creador Activo",
    icon: "sparkles" as const,
    earned: true,
    category: "social",
    tier: "silver",
    description: "Publicó más de 10 ideas inspiradoras con contenido valioso en el muro social.",
    unlockedAt: "18 Ene 2026",
    ring: "ring-violet-200",
    bg: "bg-violet-50",
    color: "text-violet-500"
  },
  {
    id: "lider",
    label: "Líder de Opinión",
    icon: "star" as const,
    earned: true,
    category: "social",
    tier: "gold",
    description: "Consiguió que sus posts recibieran más de 100 reacciones positivas de la comunidad.",
    unlockedAt: "02 Feb 2026",
    ring: "ring-amber-200",
    bg: "bg-amber-50",
    color: "text-amber-500"
  },
  {
    id: "estudiante_aplicado",
    label: "Erudito",
    icon: "bookOpen" as const,
    earned: true,
    category: "academic",
    tier: "bronze",
    description: "Demostró sed de conocimiento completando exitosamente sus primeras 10 lecciones.",
    unlockedAt: "15 Ene 2026",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50",
    color: "text-emerald-500"
  },
  {
    id: "graduado",
    label: "Graduado",
    icon: "award" as const,
    earned: false,
    category: "academic",
    tier: "silver",
    description: "Completa tu primer curso completo en el aula virtual de la academia.",
    ring: "ring-slate-200",
    bg: "bg-slate-50/50",
    color: "text-slate-400"
  },
  {
    id: "guardian",
    label: "Guardián",
    icon: "shield" as const,
    earned: false,
    category: "special",
    tier: "diamond",
    description: "Mantén una racha ininterrumpida de conexión por 30 días seguidos.",
    ring: "ring-slate-200",
    bg: "bg-slate-50/50",
    color: "text-slate-400"
  },
  {
    id: "networker",
    label: "Conector",
    icon: "users" as const,
    earned: false,
    category: "special",
    tier: "gold",
    description: "Expande la comunidad invitando a 5 nuevos miembros activos con tu código.",
    ring: "ring-slate-200",
    bg: "bg-slate-50/50",
    color: "text-slate-400"
  },
  {
    id: "critico",
    label: "Comentarista",
    icon: "messageSquare" as const,
    earned: false,
    category: "social",
    tier: "bronze",
    description: "Aporta valor comentando 20 veces de forma constructiva en posts ajenos.",
    ring: "ring-slate-200",
    bg: "bg-slate-50/50",
    color: "text-slate-400"
  }
];

export const PROFILE_RANKING = [
  { rank: 1, name: "Sofia M.", xp: "1,450 XP", avatar: "https://i.pravatar.cc/150?u=sofia", isYou: false },
  { rank: 2, name: "Alex C.", xp: "1,260 XP", avatar: "https://i.pravatar.cc/150?u=alex", isYou: true },
  { rank: 3, name: "Carlos R.", xp: "1,100 XP", avatar: "https://i.pravatar.cc/150?u=carlos", isYou: false },
];

export const PROFILE_ACTIVITY = [
  {
    id: "1",
    text: "Completaste la lección **'Diseño de Sistemas'**",
    time: "Hace 2 horas",
    icon: "graduation" as const,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    id: "2",
    text: "Reaccionaste con ❤️ al comentario de **María**",
    time: "Hace 5 horas",
    icon: "heart" as const,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
];
