import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApiFetch } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { isAdmin } from "../../../lib/permissions";

interface AddChapterFormProps {
  courseId: string;
  onAdded: () => void;
}

export default function AddChapterForm({ courseId, onAdded }: AddChapterFormProps) {
  const { user } = useAuth();
  const api = useApiFetch();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título del capítulo es obligatorio");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await api(`/api/courses/${courseId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          videoUrl: videoUrl.trim() || undefined,
          duration: duration.trim() || undefined,
        }),
      });

      setTitle("");
      setVideoUrl("");
      setDuration("");
      setExpanded(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin(user?.role)) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-violet-200 text-violet-700 font-bold text-sm hover:bg-violet-50 transition-colors"
      >
        <Plus size={18} /> Añadir capítulo
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-4 space-y-3"
    >
      <p className="text-sm font-black text-slate-900">Nuevo capítulo</p>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del capítulo *"
        className="w-full bg-white rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
      />

      <input
        type="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="URL del video (YouTube embed, opcional)"
        className="w-full bg-white rounded-xl py-2.5 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-200"
      />

      <input
        type="text"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Duración (ej. 10:00, opcional)"
        className="w-full bg-white rounded-xl py-2.5 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-200"
      />

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-2.5 bg-[#ae3df7] text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Guardar capítulo"}
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setError(null);
          }}
          className="px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl border border-slate-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
