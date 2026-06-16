import React, { useState, useEffect, useCallback } from "react";
import { Plus, Radio, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useApiFetch } from "../../../lib/api";
import { isAdmin } from "../../../lib/permissions";
import LivePlayer from "./LivePlayer";
import LiveChat from "./LiveChat";
import LiveReactions from "./LiveReactions";
import LivePdfs from "./LivePdfs";
import Spinner from "../../../shared/ui/Spinner";

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
  isActive: boolean;
  scheduledAt?: string;
  createdAt: string;
}

function useCountdown(targetDate?: string | null) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!targetDate) { setText(""); return; }

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setText("¡Ya es la hora!"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setText(`${d}d ${h}h ${m}m`);
      else if (h > 0) setText(`${h}h ${m}m ${s}s`);
      else setText(`${m}m ${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return text;
}

export default function LiveView() {
  const { user } = useAuth();
  const api = useApiFetch();
  const userIsAdmin = isAdmin(user?.role);

  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [nextScheduled, setNextScheduled] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdown(nextScheduled?.scheduledAt);

  const fetchCurrentLive = useCallback(async () => {
    try {
      const { data: all } = await api<LiveSession[]>("/api/lives/");
      const active = all.find((l) => l.isActive) ?? null;
      setLiveSession(active);
      if (!active) {
        const upcoming = all
          .filter((l) => !l.isActive && l.scheduledAt && new Date(l.scheduledAt) > new Date())
          .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
        setNextScheduled(upcoming[0] ?? null);
      } else {
        setNextScheduled(null);
      }
    } catch (err) {
      console.error("[LiveView] Error fetching live:", err);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCurrentLive();
    // 10s cuando hay live activo, 30s cuando no hay (reduce carga en Supabase)
    const interval = setInterval(fetchCurrentLive, liveSession ? 10_000 : 30_000);
    return () => clearInterval(interval);
  }, [fetchCurrentLive, liveSession?.id]);

  const handleCreateLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { setError("El título es obligatorio"); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: created } = await api<LiveSession>("/api/admin/lives/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          youtubeUrl: newUrl.trim() || undefined,
          description: newDescription.trim() || undefined,
          scheduledAt: newScheduledAt || undefined,
        }),
      });
      const { data } = await api<LiveSession>(`/api/admin/lives/${created.id}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      setLiveSession(data);
      setShowForm(false);
      setNewTitle(""); setNewUrl(""); setNewDescription(""); setNewScheduledAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear transmisión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndLive = async () => {
    if (!liveSession || !window.confirm("¿Seguro que quieres terminar esta transmisión?")) return;
    try {
      await api(`/api/admin/lives/${liveSession.id}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      setLiveSession(null);
    } catch (err) {
      console.error("[LiveView] Error ending live:", err);
      alert("Error al terminar la transmisión");
    }
  };

  if (isLoading) return <Spinner />;

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 transition-colors";

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:h-[calc(100vh-8rem)]">
      <header className="flex items-start justify-between gap-4 mb-4 lg:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="text-red-500" size={24} />
            En Vivo
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Conéctate e interactúa en tiempo real</p>
        </div>
        {userIsAdmin && liveSession && (
          <button
            onClick={handleEndLive}
            className="px-3 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors shrink-0"
          >
            <span className="hidden sm:inline">Terminar </span>transmisión
          </button>
        )}
      </header>

      {liveSession ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:min-h-0 lg:overflow-hidden">
          {/* Columna izquierda: video + descripción + reacciones + PDFs */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 lg:overflow-y-auto 3xl:flex-none 3xl:w-[760px]">
            <LivePlayer youtubeUrl={liveSession.youtubeUrl ?? ""} />

            <div className="flex items-start justify-between gap-4 px-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">{liveSession.title}</h2>
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded">
                    En vivo ahora
                  </span>
                </div>
                {liveSession.description && (
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{liveSession.description}</p>
                )}
              </div>
              <div className="shrink-0 mt-1">
                <LiveReactions liveId={liveSession.id} />
              </div>
            </div>

            <LivePdfs liveId={liveSession.id} isAdmin={userIsAdmin} />
          </div>

          {/* Columna derecha: chat */}
          <div className="w-full lg:w-[380px] xl:w-[420px] 3xl:flex-1 lg:shrink-0 3xl:shrink lg:min-h-0">
            <LiveChat liveId={liveSession.id} />
          </div>
        </div>
      ) : (
        <div className="min-h-[60vh] lg:flex-1 lg:min-h-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Radio className="text-slate-400" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900">No hay ninguna transmisión activa</h2>

          {/* Countdown para el próximo live programado */}
          {nextScheduled && (
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-2xl px-6 py-4 max-w-sm">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">Próximo live</p>
              <p className="font-black text-slate-900">{nextScheduled.title}</p>
              <div className="flex items-center gap-1.5 mt-2 text-violet-600">
                <Clock size={14} />
                <span className="text-sm font-bold">{countdown || "Calculando..."}</span>
              </div>
            </div>
          )}

          {!nextScheduled && (
            <p className="text-slate-500 mt-2 max-w-md text-sm">
              Mantente atento a nuestros anuncios para saber cuándo será la próxima sesión en vivo.
            </p>
          )}

          {userIsAdmin && (
            <div className="mt-8 w-full max-w-md">
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#ae3df7] text-white rounded-2xl font-bold shadow-md hover:bg-[#921be2] transition-colors"
                >
                  <Plus size={20} /> Empezar nueva transmisión
                </button>
              ) : (
                <form onSubmit={handleCreateLive} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
                  <h3 className="font-bold text-slate-900">Configurar transmisión</h3>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Título *</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej. Q&A Semanal — Ecom Club" className={inputClass} required />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">URL de YouTube <span className="font-normal text-slate-400">(opcional)</span></label>
                    <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..." className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Descripción <span className="font-normal text-slate-400">(opcional)</span></label>
                    <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="De qué trata esta sesión..." rows={2}
                      className={`${inputClass} resize-none`} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Hora programada <span className="font-normal text-slate-400">(opcional)</span></label>
                    <input type="datetime-local" value={newScheduledAt} onChange={(e) => setNewScheduledAt(e.target.value)}
                      className={inputClass} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-600 transition-colors disabled:opacity-50">
                      {isSubmitting ? "Iniciando..." : "Iniciar en vivo"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
