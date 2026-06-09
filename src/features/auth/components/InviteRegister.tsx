import React, { useState, useEffect } from "react";
import { Lock, User, Sparkles, ShieldCheck, XCircle, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch, API_BASE } from "../../../lib/api";
import logo from "../../../assets/logo.png";

interface InviteRegisterProps {
  onGoToLogin: () => void;
}

type ValidationState = "loading" | "valid" | "invalid";

export default function InviteRegister({ onGoToLogin }: InviteRegisterProps) {
  const { login } = useAuth();

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [validation, setValidation] = useState<ValidationState>("loading");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invalidReason, setInvalidReason] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidReason("No se encontró un token de invitación en la URL.");
      setValidation("invalid");
      return;
    }
    apiFetch<unknown>(
      `/api/invitations/validate?token=${token}`
    )
      .then(({ data }) => {
        // Supabase RPCs sometimes return an array instead of a single object
        const result = (Array.isArray(data) ? data[0] : data) as { valid?: boolean; email?: string; reason?: string } | undefined;
        console.log("[invite] validate response:", result);
        if (result?.valid && result?.email) {
          setInvitedEmail(result.email);
          setValidation("valid");
        } else {
          setInvalidReason(result?.reason ?? "Invitación inválida o expirada.");
          setValidation("invalid");
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        console.error("[invite] validate error:", msg);
        setInvalidReason(`No se pudo verificar la invitación: ${msg}`);
        setValidation("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: invitedEmail, password, role: "Invitado" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || "Error al crear la cuenta");
        return;
      }
      if (!data.user || !data.token) {
        setError("Cuenta creada pero no se pudo iniciar sesión automáticamente. Inicia sesión manualmente.");
        return;
      }
      try {
        await apiFetch("/api/invitations/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (useErr: unknown) {
        console.error("[invite] use_token failed:", useErr instanceof Error ? useErr.message : useErr);
      }
      login(data.user, data.token);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (validation === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <span className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-bold text-sm">Verificando tu invitación...</p>
        </div>
      </div>
    );
  }

  if (validation === "invalid") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] p-12 border border-red-100 shadow-sm text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Invitación inválida</h2>
          <p className="text-slate-500 font-medium mb-8">{invalidReason}</p>
          <button
            onClick={onGoToLogin}
            className="text-indigo-600 font-black text-sm hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Left side: exclusive panel */}
        <div className="md:col-span-7 bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-between min-h-[420px] order-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-indigo-200 text-xs font-black uppercase tracking-widest mb-8">
              <ShieldCheck size={14} /> Acceso exclusivo por invitación
            </div>
            <h1 className="text-5xl font-black mb-4 leading-[1.1] tracking-tight">
              Has sido invitado.
            </h1>
            <p className="text-slate-300 font-medium mb-10 text-lg">
              Eres parte de un grupo selecto. Completa tu registro para acceder a la comunidad.
            </p>
            <div className="space-y-5">
              {[
                { title: "Solo por invitación", desc: "Este acceso fue reservado especialmente para ti." },
                { title: "Comunidad privada", desc: "Conecta con personas cuidadosamente seleccionadas." },
                { title: "Contenido exclusivo", desc: "Recursos y cursos disponibles solo para miembros." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-bold">{f.title}</h4>
                    <p className="text-slate-400 text-sm font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 pt-12">
            <p className="text-slate-500 text-sm font-bold italic">
              "La excelencia no es un destino, es un viaje constante."
            </p>
          </div>
        </div>

        {/* Right side: form */}
        <div className="md:col-span-5 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-center order-2">
          <div className="mb-8 flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="text-2xl font-black text-slate-900">Completa tu registro</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Tu email ya está vinculado a esta invitación.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email locked */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={invitedEmail}
                  readOnly
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Unirme a la comunidad <Sparkles size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-sm font-medium text-slate-500">
              ¿Ya tienes cuenta?{" "}
              <button onClick={onGoToLogin} className="text-indigo-600 font-bold hover:underline">
                Inicia Sesión
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
