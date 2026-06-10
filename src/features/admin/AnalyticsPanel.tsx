import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Activity,
  DollarSign,
  Clock,
  RefreshCw,
  XCircle,
  CheckCircle,
  CalendarClock,
  MapPin,
  Cake,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { useApiFetch } from "../../lib/api";
import type {
  AnalyticsOverview,
  AnalyticsMembersDetail,
  AnalyticsRevenue,
  AnalyticsSnapshot,
} from "../../types";

const HISTORY_LIMIT = 30;

const STATUS_COLORS: Record<string, string> = {
  Activos: "#22c55e",
  Inactivos: "#94a3b8",
  Expirados: "#f97316",
  Invitados: "#6366f1",
};

const GENDER_COLORS: Record<string, string> = {
  Hombres: "#6366f1",
  Mujeres: "#f472b6",
  Otro: "#94a3b8",
};

const PLAN_LABELS: Record<string, string> = {
  "1m": "1 mes",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
};

function formatAmount(amount: number) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("es-ES").format(n);
}

function formatShortDate(value: string) {
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return value;
  }
}

const tooltipContentStyle = {
  borderRadius: "16px",
  border: "none",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  fontWeight: "bold" as const,
};

const axisTick = { fill: "#94a3b8", fontSize: 12, fontWeight: 700 };

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-sm">
      {label}
    </div>
  );
}

export default function AnalyticsPanel() {
  const api = useApiFetch();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [members, setMembers] = useState<AnalyticsMembersDetail | null>(null);
  const [revenue, setRevenue] = useState<AnalyticsRevenue | null>(null);
  const [history, setHistory] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [ov, mem, rev, hist] = await Promise.all([
        api<AnalyticsOverview>("/api/admin/analytics/overview"),
        api<AnalyticsMembersDetail>("/api/admin/analytics/members"),
        api<AnalyticsRevenue>("/api/admin/analytics/revenue"),
        api<AnalyticsSnapshot[]>(`/api/admin/analytics/history?limit=${HISTORY_LIMIT}`),
      ]);
      setOverview(ov.data);
      setMembers(mem.data);
      setRevenue(rev.data);
      setHistory([...hist.data].reverse());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar las estadísticas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
  }

  async function handleGenerateSnapshot() {
    setSnapshotting(true);
    setError(null);
    setNotice(null);
    try {
      await api("/api/admin/analytics/snapshot", { method: "POST" });
      setNotice("Snapshot del día actualizado correctamente.");
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al generar el snapshot");
    } finally {
      setSnapshotting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400">
        <RefreshCw size={24} className="animate-spin mr-3" />
        <span className="font-bold">Cargando estadísticas...</span>
      </div>
    );
  }

  const stats = overview
    ? [
        {
          label: "Miembros Totales",
          value: formatNumber(overview.members.total),
          change: `+${formatNumber(overview.members.new_this_month)} este mes`,
          positive: true,
          icon: <Users className="text-blue-600" />,
        },
        {
          label: "Miembros Activos",
          value: formatNumber(overview.members.active),
          change: `${overview.members.total > 0 ? Math.round((overview.members.active / overview.members.total) * 100) : 0}% del total`,
          positive: true,
          icon: <Activity className="text-purple-600" />,
        },
        {
          label: "Ingresos del Mes",
          value: formatAmount(overview.revenue.this_month),
          change: `${formatAmount(overview.revenue.today)} hoy`,
          positive: true,
          icon: <DollarSign className="text-green-600" />,
        },
        {
          label: "Pagos Pendientes",
          value: formatNumber(overview.revenue.payments_pending),
          change: `${formatNumber(overview.revenue.non_renewals)} sin renovar`,
          positive: overview.revenue.payments_pending === 0,
          icon: <Clock className="text-amber-600" />,
        },
      ]
    : [];

  const statusData = members
    ? [
        { name: "Activos", value: members.active },
        { name: "Inactivos", value: members.inactive },
        { name: "Expirados", value: members.expired },
        { name: "Invitados", value: members.invited },
      ].filter((d) => d.value > 0)
    : [];

  const genderData = members
    ? [
        { name: "Hombres", value: members.gender.male },
        { name: "Mujeres", value: members.gender.female },
        { name: "Otro", value: members.gender.other },
      ].filter((d) => d.value > 0)
    : [];

  const ageData = members?.ages.filter((a) => a.total > 0) ?? [];
  const locationData = members?.locations.filter((l) => l.total > 0) ?? [];

  const planData = revenue
    ? (Object.keys(PLAN_LABELS) as Array<keyof typeof PLAN_LABELS>).map((key) => ({
        name: PLAN_LABELS[key],
        value: revenue.by_plan[key as "1m" | "3m" | "6m" | "1y"],
      }))
    : [];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">Estadísticas en tiempo real</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Datos actualizados al momento desde la base de datos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Actualizar
          </button>
          <button
            onClick={handleGenerateSnapshot}
            disabled={snapshotting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-60"
          >
            <CalendarClock size={15} className={snapshotting ? "animate-spin" : ""} /> Generar snapshot
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm font-bold rounded-2xl px-5 py-4 flex items-center gap-2">
          <CheckCircle size={16} /> {notice}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
              <div className={`flex items-center text-xs font-black ${stat.positive ? "text-green-500" : "text-red-500"}`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.1em]">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            <p className="text-slate-400 text-xs font-bold mt-2">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue history + new members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-1">Ingresos Diarios</h3>
          <p className="text-slate-500 text-sm font-medium mb-8">Últimos {HISTORY_LIMIT} días con snapshot registrado.</p>
          <div className="h-[350px] w-full">
            {history.length === 0 ? (
              <EmptyChartState label="Aún no hay snapshots históricos." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatShortDate} axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelFormatter={formatShortDate}
                    formatter={(value: number) => [formatAmount(value), "Ingresos"]}
                  />
                  <Area type="monotone" dataKey="revenue_day" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-800 shadow-xl text-white">
          <h3 className="text-xl font-black mb-2">Nuevos Miembros</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">Registros diarios en los últimos {HISTORY_LIMIT} días.</p>
          <div className="h-[300px] w-full">
            {history.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-600 font-bold text-sm">
                Aún no hay snapshots históricos.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <XAxis dataKey="snapshot_date" tickFormatter={formatShortDate} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} dy={10} />
                  <Bar dataKey="new_members" radius={[10, 10, 10, 10]}>
                    {history.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#4f46e5"} />
                    ))}
                  </Bar>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "12px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    labelFormatter={formatShortDate}
                    formatter={(value: number) => [formatNumber(value), "Nuevos"]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Hoy</p>
              <p className="text-xl font-black">{overview ? formatNumber(overview.members.new_today) : "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Este mes</p>
              <p className="text-xl font-black">{overview ? formatNumber(overview.members.new_this_month) : "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total</p>
              <p className="text-xl font-black">{overview ? formatNumber(overview.members.total) : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics: status, gender, age */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1">Estado de Miembros</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Distribución de suscripciones.</p>
          <div className="h-[220px] w-full">
            {statusData.length === 0 ? (
              <EmptyChartState label="Sin datos disponibles." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#cbd5e1"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value: number) => formatNumber(value)} />
                  <Legend iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1">Género</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Distribución de miembros por género.</p>
          <div className="h-[220px] w-full">
            {genderData.length === 0 ? (
              <EmptyChartState label="Sin datos disponibles." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={GENDER_COLORS[entry.name] ?? "#cbd5e1"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value: number) => formatNumber(value)} />
                  <Legend iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
            <Cake size={18} className="text-indigo-600" /> Rangos de Edad
          </h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Miembros por rango etario.</p>
          <div className="h-[220px] w-full">
            {ageData.length === 0 ? (
              <EmptyChartState label="Sin datos disponibles." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis type="category" dataKey="age_range" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} width={90} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value: number) => formatNumber(value)} />
                  <Bar dataKey="total" radius={[0, 10, 10, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Locations + Revenue by plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" /> Miembros por Ciudad
          </h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Distribución geográfica de la comunidad.</p>
          {locationData.length === 0 ? (
            <div className="py-12">
              <EmptyChartState label="Sin datos disponibles." />
            </div>
          ) : (
            <div className="space-y-4">
              {locationData.map((loc) => (
                <div key={loc.city}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-700">{loc.city || "Sin especificar"}</span>
                    <span className="text-xs font-black text-slate-400">{formatNumber(loc.total)} · {loc.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-400 transition-all duration-700"
                      style={{ width: `${Math.min(loc.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1">Ingresos por Plan</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Total histórico acumulado por tipo de plan.</p>
          <div className="h-[260px] w-full">
            {!revenue || planData.every((p) => p.value === 0) ? (
              <EmptyChartState label="Sin datos disponibles." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatAmount(v)} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value: number) => formatAmount(value)} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {planData.map((_, index) => (
                      <Cell key={`plan-${index}`} fill={["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ingresos Totales</p>
              <p className="text-xl font-black text-slate-900 mt-1">{revenue ? formatAmount(revenue.total) : "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">No Renovaron</p>
              <p className="text-xl font-black text-slate-900 mt-1">{revenue ? formatNumber(revenue.non_renewals) : "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
