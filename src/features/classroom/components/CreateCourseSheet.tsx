import React, { useState } from "react";
import { Camera, Save, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApiFetch } from "../../../lib/api";
import { Course } from "../../../types";

interface CreateCourseSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  course?: Course | null;
}

export default function CreateCourseSheet({ open, onClose, onCreated, course }: CreateCourseSheetProps) {
  const api = useApiFetch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open && course) {
      setTitle(course.title);
      setDescription(course.description);
      setCategory(course.category ?? "General");
      setThumbnailPreview(course.thumbnail);
      setThumbnailUrl(course.thumbnail);
    } else if (open && !course) {
      reset();
    }
    // eslint-disable-next-line
  }, [open, course]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("General");
    setThumbnailPreview("");
    setThumbnailUrl("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setThumbnailPreview(dataUrl);

        api<{ url: string }>("/api/courses/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: dataUrl }),
        })
          .then(({ data }) => setThumbnailUrl(data.url))
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Error al subir imagen");
            setThumbnailPreview("");
          })
          .finally(() => setIsUploading(false));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("El nombre del curso es obligatorio"); return; }
    if (!description.trim()) { setError("La descripción es obligatoria"); return; }
    if (!thumbnailUrl) { setError("Sube una imagen para el curso"); return; }

    setIsSaving(true);
    try {
      if (course) {
        await api(`/api/courses/${course.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            thumbnail: thumbnailUrl,
            category: category.trim() || "General",
          }),
        });
      } else {
        await api("/api/courses/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            thumbnail: thumbnailUrl,
            category: category.trim() || "General",
          }),
        });
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : course ? "Error al editar el curso" : "Error al crear el curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el curso "${course.title}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      await api(`/api/courses/${course.id}`, {
        method: "DELETE",
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el curso");
    } finally {
      setIsDeleting(false);
    }
  };

  const isEdit = Boolean(course);
  const modalTitle = isEdit ? "Editar curso" : "Subir curso";

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          Nombre del curso
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Emprendimiento 101"
          className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold outline-none"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="¿De qué trata este curso?"
          className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-medium outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          Categoría
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ej. Marketing, Finanzas, General..."
          className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-medium outline-none"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          Imagen del curso
        </label>
        <div className="mt-2 flex items-start gap-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Camera size={28} />
              </div>
            )}
          </div>
          <label
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-violet-200 text-sm font-bold cursor-pointer transition-colors ${
              isUploading
                ? "bg-violet-50 text-violet-300 cursor-not-allowed"
                : "bg-violet-50/50 text-violet-700 hover:bg-violet-50"
            }`}
          >
            {isUploading ? "Subiendo..." : "Elegir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className={isEdit ? "grid grid-cols-2 gap-3" : "w-full"}>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving || isDeleting || isUploading}
            className="flex items-center justify-center gap-2 py-3.5 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold rounded-2xl disabled:opacity-50 transition-all cursor-pointer"
          >
            {isDeleting ? "Eliminando..." : <><Trash2 size={18} /> Eliminar</>}
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving || isDeleting || isUploading}
          className="flex items-center justify-center gap-2 py-3.5 bg-[#ae3df7] text-white font-bold rounded-2xl hover:bg-[#921be2] disabled:opacity-50 transition-all cursor-pointer w-full"
        >
          {isSaving ? "Guardando..." : (
            <><Save size={18} /> {isEdit ? "Guardar cambios" : "Crear curso"}</>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-60"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-70 bg-white rounded-t-4xl p-6 pb-28 max-h-[90vh] overflow-y-auto lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">{modalTitle}</h2>
              <button type="button" onClick={handleClose} className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <X size={20} />
              </button>
            </div>
            {formContent}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="hidden lg:block fixed inset-0 z-60"
          >
            <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
            <div className="relative mx-auto mt-16 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">{modalTitle}</h2>
                <button type="button" onClick={handleClose} className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <X size={20} />
                </button>
              </div>
              {formContent}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
