import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../lib/api";
import ProfileHero from "./ProfileHero";
import ProfileLevelCard from "./ProfileLevelCard";
import ProfileStatsGrid from "./ProfileStatsGrid";
import ProfileAchievements from "./ProfileAchievements";
import ProfileRanking from "./ProfileRanking";
import ProfileActivity from "./ProfileActivity";
import ProfileEditSheet, { ProfileEditForm } from "./ProfileEditSheet";
import { PROFILE_LEVEL } from "../data/profileMock";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    name: user?.name || "",
    avatar: user?.avatar || "",
    bio: user?.bio || "",
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

        fetch(`${API_BASE}/api/auth/avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, imageData: dataUrl }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Error al subir imagen");
            if (data.url) setUploadedAvatarUrl(data.url);
            else throw new Error("URL de imagen no recibida");
          })
          .catch((err) => {
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
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          name: editForm.name,
          avatar: uploadedAvatarUrl ?? editForm.avatar,
          bio: editForm.bio,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
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
    });
  };

  const subtitle = user?.bio
    ? `${user.bio} • Nivel ${PROFILE_LEVEL.level}`
    : undefined;

  return (
    <>
      <div className="max-w-lg mx-auto lg:max-w-4xl space-y-6 pb-4">
        <ProfileHero
          name={user?.name ?? "Usuario"}
          avatar={user?.avatar}
          subtitle={subtitle}
          onEdit={openEdit}
        />

        <div className="space-y-6 px-4 md:px-0">
          <ProfileLevelCard />
          <ProfileStatsGrid />
          <ProfileAchievements />
          <ProfileRanking />
          <ProfileActivity />
        </div>

        {/* Panel de edición en desktop */}
        {isEditing && (
          <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
            <div className="relative mx-auto mt-24 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
              <h2 className="text-xl font-black mb-6">Editar perfil</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Nombre público
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full mt-1 bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full mt-1 bg-slate-50 rounded-xl py-3 px-4 text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#8B5E3C] text-white font-bold rounded-2xl disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-6 py-3 bg-slate-100 font-bold rounded-2xl"
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
