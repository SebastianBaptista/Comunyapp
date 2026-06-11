import React, { useState, useEffect } from "react";
import { Plus, Radio, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useApiFetch } from "../../../lib/api";
import { isAdmin } from "../../../lib/permissions";
import LivePlayer from "./LivePlayer";
import LiveChat from "./LiveChat";
import Spinner from "../../../shared/ui/Spinner";

interface LiveSession {
  id: string;
  title: string;
  youtube_url: string;
  is_active: boolean;
  created_at: string;
}

export default function LiveView() {
  const { user } = useAuth();
  const api = useApiFetch();
  const userIsAdmin = isAdmin(user?.role);

  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin Form State
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentLive = async () => {
    try {
      const { data } = await api<LiveSession | null>("/api/lives/current");
      setLiveSession(data);
    } catch (err) {
      console.error("[LiveView] Error fetching live session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLive();
    // Poll for live session changes every 10 seconds (e.g., if admin starts one)
    const interval = setInterval(fetchCurrentLive, 10000);
    return () => clearInterval(interval);
  }, [api]);

  const handleCreateLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await api<LiveSession>("/api/lives/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), youtube_url: newUrl.trim() }),
      });
      setLiveSession(data);
      setShowForm(false);
      setNewTitle("");
      setNewUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear transmisión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndLive = async () => {
    if (!liveSession || !window.confirm("¿Seguro que quieres terminar esta transmisión?")) return;
    try {
      await api(`/api/lives/${liveSession.id}/end`, { method: "POST" });
      setLiveSession(null);
    } catch (err) {
      console.error("[LiveView] Error ending live:", err);
      alert("Error al terminar la transmisión");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]">
      <header className="flex items-start justify-between gap-4 mb-6 shrink-0">
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
            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors"
          >
            Terminar Transmisión
          </button>
        )}
      </header>

      {liveSession ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto lg:overflow-visible">
            <LivePlayer youtubeUrl={liveSession.youtube_url} />
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-900">{liveSession.title}</h2>
              <span className="inline-block mt-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded">En vivo ahora</span>
            </div>
          </div>
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
            <LiveChat liveId={liveSession.id} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Radio className="text-slate-400" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900">No hay ninguna transmisión activa</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Mantente atento a nuestros anuncios para saber cuándo será la próxima sesión en vivo.
          </p>
          
          {userIsAdmin && (
            <div className="mt-8 w-full max-w-md">
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#ae3df7] text-white rounded-2xl font-bold shadow-md shadow-violet-950/10 hover:bg-[#921be2] transition-colors"
                >
                  <Plus size={20} /> Empezar nueva transmisión
                </button>
              ) : (
                <form onSubmit={handleCreateLive} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 mb-4">Configurar nueva transmisión</h3>
                  {error && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ej. Q&A Semanal - Ecom Club"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">URL de YouTube</label>
                      <input
                        type="url"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="Ej. https://www.youtube.com/watch?v=..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Iniciando..." : "Iniciar en vivo"}
                      </button>
                    </div>
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
