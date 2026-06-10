import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Camera, X, RefreshCw, Trophy, Star } from "lucide-react";
import { useApiFetch } from "../../lib/api";
import type { Level, Badge } from "../../types";

type TabType = "levels" | "badges";

export default function GamificationPanel() {
  const api = useApiFetch();
  const [activeTab, setActiveTab] = useState<TabType>("levels");
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  
  // Forms state
  const [editingLevel, setEditingLevel] = useState<Partial<Level>>({});
  const [editingBadge, setEditingBadge] = useState<Partial<Badge>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [levelsRes, badgesRes] = await Promise.all([
        api<Level[]>("/api/admin/levels/tiers").catch(() => ({ data: [] })),
        api<Badge[]>("/api/admin/achievements/").catch(() => ({ data: [] }))
      ]);
      setLevels(levelsRes.data || []);
      setBadges(badgesRes.data || []);
    } catch (e: any) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Image Upload Handler ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>, field: string, endpoint: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 300;
        const scaleSize = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        
        try {
          const { data } = await api<{ url: string }>(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: dataUrl })
          });
          setter((prev: any) => ({ ...prev, [field]: data.url }));
        } catch (err: any) {
          alert("Error subiendo imagen: " + err.message);
        } finally {
          setIsUploading(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Levels CRUD ---
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isEdit = !!editingLevel.id;
      const url = isEdit ? `/api/admin/levels/tiers/${editingLevel.id}` : "/api/admin/levels/tiers";
      const method = isEdit ? "PATCH" : "POST";
      
      const { data } = await api<Level>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLevel)
      });
      
      if (isEdit) {
        setLevels(prev => prev.map(l => l.id === data.id ? data : l));
      } else {
        setLevels(prev => [...prev, data]);
      }
      setIsLevelModalOpen(false);
    } catch (e: any) {
      alert("Error al guardar nivel: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este nivel?")) return;
    try {
      await api(`/api/admin/levels/tiers/${id}`, { method: "DELETE" });
      setLevels(prev => prev.filter(l => l.id !== id));
    } catch (e: any) {
      alert("Error al eliminar nivel: " + e.message);
    }
  };

  // --- Badges CRUD ---
  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isEdit = !!editingBadge.id;
      const url = isEdit ? `/api/admin/achievements/${editingBadge.id}` : "/api/admin/achievements/";
      const method = isEdit ? "PATCH" : "POST";
      
      const { data } = await api<Badge>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBadge)
      });
      
      if (isEdit) {
        setBadges(prev => prev.map(b => b.id === data.id ? data : b));
      } else {
        setBadges(prev => [...prev, data]);
      }
      setIsBadgeModalOpen(false);
    } catch (e: any) {
      alert("Error al guardar insignia: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta insignia?")) return;
    try {
      await api(`/api/admin/achievements/${id}`, { method: "DELETE" });
      setBadges(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
      alert("Error al eliminar insignia: " + e.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Trophy className="text-indigo-600" /> Gamificación
            </h3>
            <p className="text-slate-500 font-medium mt-1">Gestiona los niveles e insignias de tu comunidad.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("levels")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'levels' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Niveles ({levels.length})
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'badges' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Insignias ({badges.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold mb-6">
            {error}
          </div>
        )}

        {/* Levels List */}
        {activeTab === "levels" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingLevel({}); setIsLevelModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Añadir Nivel
              </button>
            </div>
            {loading && levels.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Cargando...</div>
            ) : levels.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold">No hay niveles creados.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map(level => (
                  <div key={level.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center">
                    <img src={level.icon_url || "https://via.placeholder.com/150"} alt={level.name} className="w-24 h-24 object-cover rounded-full mb-4 shadow-sm bg-white" />
                    <h4 className="font-black text-lg text-slate-900">{level.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-2">{level.description}</p>
                    <div className="mt-6 flex items-center justify-center gap-3 w-full">
                      <button onClick={() => { setEditingLevel(level); setIsLevelModalOpen(true); }} className="flex-1 flex justify-center items-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        <Edit2 size={14} /> Editar
                      </button>
                      <button onClick={() => handleDeleteLevel(level.id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Badges List */}
        {activeTab === "badges" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingBadge({}); setIsBadgeModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Añadir Insignia
              </button>
            </div>
            {loading && badges.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Cargando...</div>
            ) : badges.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold">No hay insignias creadas.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map(badge => (
                  <div key={badge.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center">
                    <img src={badge.icon_url || "https://via.placeholder.com/150"} alt={badge.name} className="w-20 h-20 object-contain mb-4" />
                    <h4 className="font-black text-lg text-slate-900">{badge.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-2">{badge.description}</p>
                    <div className="mt-6 flex items-center justify-center gap-3 w-full">
                      <button onClick={() => { setEditingBadge(badge); setIsBadgeModalOpen(true); }} className="flex-1 flex justify-center items-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        <Edit2 size={14} /> Editar
                      </button>
                      <button onClick={() => handleDeleteBadge(badge.id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isLevelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLevelModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-black mb-6">{editingLevel.id ? "Editar Nivel" : "Nuevo Nivel"}</h2>
              <form onSubmit={handleSaveLevel} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
                  <input type="text" required value={editingLevel.name || ""} onChange={e => setEditingLevel({...editingLevel, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Descripción</label>
                  <textarea required rows={3} value={editingLevel.description || ""} onChange={e => setEditingLevel({...editingLevel, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ícono / Imagen</label>
                  <div className="flex gap-4 items-center">
                    {editingLevel.icon_url && (
                      <img src={editingLevel.icon_url} alt="Icon Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200 bg-slate-50" />
                    )}
                    <label className="flex-1 flex justify-center items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 font-bold text-sm">
                      <Camera size={18} />
                      {isUploading ? "Subiendo..." : "Subir Imagen"}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => handleImageUpload(e, setEditingLevel, 'icon_url', '/api/admin/levels/tiers/icon')} />
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" disabled={isSaving || isUploading} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {isSaving ? "Guardando..." : "Guardar Nivel"}
                  </button>
                  <button type="button" onClick={() => setIsLevelModalOpen(false)} className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isBadgeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBadgeModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-black mb-6">{editingBadge.id ? "Editar Insignia" : "Nueva Insignia"}</h2>
              <form onSubmit={handleSaveBadge} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
                  <input type="text" required value={editingBadge.name || ""} onChange={e => setEditingBadge({...editingBadge, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Descripción</label>
                  <textarea required rows={3} value={editingBadge.description || ""} onChange={e => setEditingBadge({...editingBadge, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ícono / Imagen</label>
                  <div className="flex gap-4 items-center">
                    {editingBadge.icon_url && (
                      <img src={editingBadge.icon_url} alt="Icon Preview" className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-slate-50" />
                    )}
                    <label className="flex-1 flex justify-center items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 font-bold text-sm">
                      <Camera size={18} />
                      {isUploading ? "Subiendo..." : "Subir Imagen"}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => handleImageUpload(e, setEditingBadge, 'icon_url', '/api/admin/achievements/icon')} />
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" disabled={isSaving || isUploading} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {isSaving ? "Guardando..." : "Guardar Insignia"}
                  </button>
                  <button type="button" onClick={() => setIsBadgeModalOpen(false)} className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
