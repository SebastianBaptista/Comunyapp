import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useApiFetch } from "../../../lib/api";
import { MapPin, Phone, User as UserIcon, Mail, Info } from "lucide-react";
import ProfileHero from "./ProfileHero";
import ProfileLevelCard from "./ProfileLevelCard";
import ProfileStatsGrid from "./ProfileStatsGrid";
import ProfileAchievements, { UserAchievement } from "./ProfileAchievements";
import ProfileEditSheet, { ProfileEditForm } from "./ProfileEditSheet";

interface UserLevel {
  level: number;
  xp_current: number;
  xp_next: number;
  tier?: { name: string; description?: string; icon_url?: string } | null;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const api = useApiFetch();
  const [isEditing, setIsEditing] = useState(false);

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [levelLoading, setLevelLoading] = useState(true);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    api<UserLevel>("/api/levels/me")
      .then(({ data }) => setUserLevel(data))
      .catch(console.error)
      .finally(() => setLevelLoading(false));

    api<UserAchievement[]>("/api/levels/me/achievements")
      .then(({ data }) => setAchievements(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setAchievementsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    name: user?.name || "",
    avatar: user?.avatar || "",
    bio: user?.bio || "",
    gender: user?.gender || "",
    city: user?.city || "",
    phone: user?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 300;
        const scaleSize = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        setEditForm((prev) => ({ ...prev, avatar: dataUrl }));

        api<{ url: string }>("/api/auth/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: dataUrl }),
        })
          .then(({ data }) => {
            if (data.url) setUploadedAvatarUrl(data.url);
            else throw new Error("URL de imagen no recibida");
          })
          .catch((err: Error) => {
            console.error("Avatar upload error:", err);
            alert("No se pudo subir la imagen: " + err.message);
          })
          .finally(() => setIsUploadingImage(false));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await api<{ user: typeof user }>("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          avatar: uploadedAvatarUrl ?? editForm.avatar,
          bio: editForm.bio,
          gender: editForm.gender,
          city: editForm.city,
          phone: editForm.phone,
        }),
      });
      if (data.user) {
        updateUser(data.user as NonNullable<typeof user>);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      name: user?.name || "",
      avatar: user?.avatar || "",
      bio: user?.bio || "",
      gender: user?.gender || "",
      city: user?.city || "",
      phone: user?.phone || "",
    });
    setUploadedAvatarUrl(null);
    setIsEditing(true);
  };

  const closeEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: user?.name || "",
      avatar: user?.avatar || "",
      bio: user?.bio || "",
      gender: user?.gender || "",
      city: user?.city || "",
      phone: user?.phone || "",
    });
  };

  const subtitle = user?.bio
    ? `${user.bio}${userLevel ? ` • Nivel ${userLevel.level}` : ""}`
    : undefined;

  return (
    <>
      <div className="max-w-lg mx-auto lg:max-w-4xl space-y-6 pb-4">
        <ProfileHero
          name={user?.name ?? "Usuario"}
          avatar={user?.avatar}
          subtitle={subtitle}
          levelIcon={userLevel?.tier?.icon_url}
          onEdit={openEdit}
        />

        <div className="space-y-6 px-4 md:px-0">
          <ProfileLevelCard
            level={userLevel?.level ?? 1}
            xpCurrent={userLevel?.xp_current ?? 0}
            xpNext={userLevel?.xp_next ?? 100}
            tierName={userLevel?.tier?.name}
            tierDescription={userLevel?.tier?.description}
            loading={levelLoading}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileStatsGrid badgeCount={achievementsLoading ? undefined : achievements.length} />

            {/* New Personal Info Details Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                  <Info size={18} className="text-indigo-500" />
                  Datos Personales
                </h3>
                
                <div className="space-y-3">
                  {/* Ciudad */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ciudad</p>
                      <p className="text-xs font-bold text-slate-700">{user?.city || "No especificada"}</p>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono</p>
                      <p className="text-xs font-bold text-slate-700">{user?.phone || "No especificado"}</p>
                    </div>
                  </div>

                  {/* Sexo */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sexo</p>
                      <p className="text-xs font-bold text-slate-700">{user?.gender || "No especificado"}</p>
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo</p>
                      <p className="text-xs font-bold text-slate-700">{user?.email || "No especificado"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ProfileAchievements achievements={achievements} loading={achievementsLoading} />
        </div>

        {/* Panel de edición en desktop */}
        {isEditing && (
          <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
            <div className="relative mx-auto w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 z-10">
              <h2 className="text-xl font-black mb-6">Editar perfil</h2>
              
              <div className="space-y-4">
                {/* Fila 1: Nombre */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Nombre público
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>

                {/* Fila 2: Bio */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Bio / Subtítulo
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={2}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>

                {/* Fila 3: Sexo y Ciudad (Lado a lado) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Sexo
                    </label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                    >
                      <option value="">No especificado</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
                    />
                  </div>
                </div>

                {/* Fila 4: Teléfono */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Número de teléfono
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#ae3df7] text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-[#921be2] transition-colors shadow-md active:scale-[0.98]"
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-6 py-3 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileEditSheet
        open={isEditing}
        form={editForm}
        isSaving={isSaving}
        isUploadingImage={isUploadingImage}
        onClose={closeEdit}
        onChange={setEditForm}
        onSave={handleSave}
        onImageUpload={handleImageUpload}
      />
    </>
  );
}
