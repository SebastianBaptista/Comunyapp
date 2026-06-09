import React from "react";
import { Camera, Save, X, MapPin, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ProfileEditForm {
  name: string;
  avatar: string;
  bio: string;
  gender: string;
  city: string;
  phone: string;
}

interface ProfileEditSheetProps {
  open: boolean;
  form: ProfileEditForm;
  isSaving: boolean;
  isUploadingImage: boolean;
  onClose: () => void;
  onChange: (form: ProfileEditForm) => void;
  onSave: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileEditSheet({
  open,
  form,
  isSaving,
  isUploadingImage,
  onClose,
  onChange,
  onSave,
  onImageUpload,
}: ProfileEditSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[2rem] p-6 pb-28 max-h-[85vh] overflow-y-auto lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Editar perfil</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre público */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Nombre público
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => onChange({ ...form, name: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all"
                />
              </div>

              {/* Foto de perfil */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Imagen de perfil
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={form.avatar}
                    onChange={(e) => onChange({ ...form, avatar: e.target.value })}
                    placeholder="URL o sube una imagen..."
                    className="flex-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all"
                  />
                  <label
                    className={`flex items-center justify-center px-4 rounded-xl ${
                      isUploadingImage
                        ? "bg-violet-100 text-violet-300 cursor-not-allowed"
                        : "bg-violet-100 text-violet-600 cursor-pointer hover:bg-violet-200"
                    }`}
                  >
                    {isUploadingImage ? (
                      <span className="text-xs font-bold animate-pulse">...</span>
                    ) : (
                      <Camera size={20} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Sexo (Género) */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <User size={12} /> Sexo
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => onChange({ ...form, gender: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">No especificado</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Ciudad */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <MapPin size={12} /> Ciudad
                </label>
                <input
                  type="text"
                  value={form.city}
                  placeholder="Ej. Madrid, Barcelona..."
                  onChange={(e) => onChange({ ...form, city: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all"
                />
              </div>

              {/* Número de teléfono */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Phone size={12} /> Número de teléfono
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  placeholder="Ej. +34 600 000 000"
                  onChange={(e) => onChange({ ...form, phone: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  Bio / subtítulo
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => onChange({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="Explorador de Ideas..."
                  className="w-full mt-1 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-xl py-3 px-4 text-sm font-medium outline-none resize-none transition-all"
                />
              </div>

              {/* Botón Guardar */}
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#ae3df7] text-white font-bold rounded-2xl hover:bg-[#921be2] disabled:opacity-50 transition-all shadow-md shadow-violet-950/10 active:scale-[0.98]"
              >
                {isSaving ? "Guardando..." : (
                  <>
                    <Save size={18} /> Guardar cambios
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
