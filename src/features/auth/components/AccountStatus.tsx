import React, { useCallback, useEffect, useState } from "react";
import { Clock, XCircle, AlertTriangle, ShieldOff, RefreshCw, LogOut, Hash, CreditCard, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useAuth, User } from "../../../context/AuthContext";
import { useApiFetch } from "../../../lib/api";
import type { Payment } from "../../../types";

const PLAN_LABELS: Record<string, string> = {
  "1m": "1 mes",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
  indefinido: "Indefinido",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

interface StatusView {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badgeCls: string;
  badgeLabel: string;
  title: string;
  description: string;
}

function resolveStatusView(subscriptionStatus: string | null | undefined, latestPayment: Payment | null): StatusView {
  if (subscriptionStatus === "expired") {
    return {
      icon: <AlertTriangle size={32} />,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      badgeCls: "bg-violet-50 text-violet-600 border border-violet-200",
      badgeLabel: "Suscripción expirada",
      title: "Tu suscripción ha expirado",
      description:
        "Tu plan llegó a su fecha de vencimiento. Realiza un nuevo pago y envía el comprobante a un administrador para reactivar tu acceso.",
    };
  }

  if (latestPayment?.status === "pending") {
    return {
      icon: <Clock size={32} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      badgeCls: "bg-amber-50 text-amber-700 border border-amber-200",
      badgeLabel: "Pago en revisión",
      title: "Tu comprobante está en revisión",
      description:
        "Recibimos tu pago y un administrador lo revisará pronto. Te avisaremos por email en cuanto se active tu cuenta — también puedes volver a esta pantalla y pulsar \"Actualizar estado\".",
    };
  }

  if (latestPayment?.status === "failed") {
    return {
      icon: <XCircle size={32} />,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      badgeCls: "bg-red-50 text-red-600 border border-red-200",
      badgeLabel: "Pago rechazado",
      title: "Tu comprobante fue rechazado",
      description:
        "Un administrador revisó tu pago y no pudo validarlo. Verifica los datos de tu transferencia y contacta a un administrador para enviar un nuevo comprobante.",
    };
  }

  return {
    icon: <ShieldOff size={32} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-400",
    badgeCls: "bg-slate-100 text-slate-500 border border-slate-200",
    badgeLabel: "Cuenta inactiva",
    title: "Tu cuenta aún no está activa",
    description:
      "No encontramos un pago aprobado asociado a tu cuenta. Contacta a un administrador para regularizar tu suscripción y activar tu acceso.",
  };
}

export default function AccountStatus() {
  const { user, logout, updateUser } = useAuth();
  const api = useApiFetch();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api<Payment[]>(`/api/payments/${user.id}`);
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar tu información de pago.");
    } finally {
      setIsLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function handleRefreshStatus() {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);
    setRefreshNotice(null);
    try {
      const { data } = await api<{ user: User }>("/api/auth/me");
      updateUser(data.user);
      await loadPayments();
      if (data.user.subscription_status === "active") {
        setRefreshNotice("¡Tu suscripción ya está activa! Redirigiendo...");
      } else {
        setRefreshNotice("Tu estado sigue igual. Vuelve a intentarlo más tarde.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar tu estado.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const latestPayment = payments.length > 0
    ? [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  const view = resolveStatusView(user?.subscription_status, latestPayment);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-brand-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm"
      >
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${view.iconBg} ${view.iconColor}`}>
            {view.icon}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black mb-4 ${view.badgeCls}`}>
            {view.badgeLabel}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mb-3">{view.title}</h2>
          <p className="text-slate-500 font-medium leading-relaxed">{view.description}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-3" />
            <span className="font-bold text-sm">Cargando tu información...</span>
          </div>
        ) : latestPayment ? (
          <div className="bg-slate-50 rounded-2xl p-6 mt-8 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Último pago registrado</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-400 flex items-center gap-2"><CreditCard size={14} /> Plan</span>
              <span className="font-bold text-slate-700">{PLAN_LABELS[latestPayment.plan] ?? latestPayment.plan}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-400 flex items-center gap-2"><Hash size={14} /> Referencia</span>
              <span className="font-bold text-slate-700">{latestPayment.reference_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-400 flex items-center gap-2"><Calendar size={14} /> Enviado</span>
              <span className="font-bold text-slate-700">{formatDate(latestPayment.created_at)}</span>
            </div>
            {latestPayment.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-400 flex items-center gap-2"><Calendar size={14} /> Vence</span>
                <span className="font-bold text-slate-700">{formatDate(latestPayment.expires_at)}</span>
              </div>
            )}
          </div>
        ) : null}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 mt-6 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}
        {refreshNotice && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold rounded-2xl px-5 py-4 mt-6 flex items-center gap-2">
            <RefreshCw size={16} /> {refreshNotice}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-8 border-t border-slate-100">
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            Actualizar estado
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </motion.div>
    </div>
  );
}
