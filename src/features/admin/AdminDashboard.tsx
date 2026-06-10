import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CreditCard,
  Building2,
  Briefcase,
  Save,
  Mail,
  Send,
  Trash2,
  Search,
  RefreshCw,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApiFetch } from "../../lib/api";
import type { Payment, PlanType } from "../../types";
import GamificationPanel from "./GamificationPanel";
import AnalyticsPanel from "./AnalyticsPanel";

interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  status: "pendiente" | "usada" | "expirada";
}

type StatusFilter = "todos" | "pendiente" | "usada" | "expirada";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

const statusConfig = {
  pendiente: { label: "Pendiente", icon: <Clock size={12} />, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  usada:     { label: "Usada",     icon: <CheckCircle size={12} />, cls: "bg-green-50 text-green-700 border border-green-200" },
  expirada:  { label: "Expirada",  icon: <XCircle size={12} />,    cls: "bg-red-50 text-red-600 border border-red-200" },
};

function InvitationsPanel() {
  const api = useApiFetch();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [searchFilter, setSearchFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api<Invitation[]>("/api/invitations/");
      setInvitations(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar invitaciones");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadInvitations(); }, [loadInvitations]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await api("/api/invitations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      setSubmitSuccess(`Invitación enviada a ${emailInput.trim()}`);
      setEmailInput("");
      await loadInvitations();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Error al crear invitación");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(inv: Invitation) {
    const link = `${window.location.origin}/invite?token=${inv.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api(`/api/invitations/${id}`, { method: "DELETE" });
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar invitación");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = invitations.filter((inv) => {
    const matchesStatus = statusFilter === "todos" || inv.status === statusFilter;
    const matchesSearch = inv.email.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    todos: invitations.length,
    pendiente: invitations.filter((i) => i.status === "pendiente").length,
    usada: invitations.filter((i) => i.status === "usada").length,
    expirada: invitations.filter((i) => i.status === "expirada").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Invite form */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <UserPlus className="text-indigo-600" /> Enviar Invitación
        </h3>
        <p className="text-slate-500 font-medium mb-8">
          Ingresa el email de la persona que deseas invitar a la comunidad.
        </p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 max-w-xl">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              placeholder="nombre@email.com"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setSubmitError(null); setSubmitSuccess(null); }}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-60 whitespace-nowrap"
          >
            {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            Invitar
          </button>
        </form>
        <AnimatePresence>
          {submitError && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 text-red-600 text-sm font-bold flex items-center gap-2">
              <XCircle size={16} /> {submitError}
            </motion.p>
          )}
          {submitSuccess && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 text-green-600 text-sm font-bold flex items-center gap-2">
              <CheckCircle size={16} /> {submitSuccess}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Invitations list */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Mail className="text-indigo-600" /> Lista de Invitados
            </h3>
            <p className="text-slate-500 font-medium mt-1">{invitations.length} invitaciones en total</p>
          </div>
          <button onClick={loadInvitations} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm font-bold transition-all outline-none"
            />
          </div>
          {/* Status tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit h-fit overflow-x-auto">
            {(["todos", "pendiente", "usada", "expirada"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${statusFilter === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className={`ml-1.5 text-[10px] ${statusFilter === s ? "text-indigo-400" : "text-slate-400"}`}>
                  ({counts[s]})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 mb-4 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}

        {/* Table */}
        {loading && invitations.length === 0 ? (
          <div className="flex justify-center items-center py-16 text-slate-400">
            <RefreshCw size={24} className="animate-spin mr-3" />
            <span className="font-bold">Cargando invitaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Mail size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">No hay invitaciones{statusFilter !== "todos" ? ` con estado "${statusFilter}"` : ""}{searchFilter ? ` para "${searchFilter}"` : ""}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Email</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Estado</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Creada</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Expira</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4">Usada el</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pl-4">Link</th>
                  <th className="pb-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence initial={false}>
                  {filtered.map((inv) => {
                    const sc = statusConfig[inv.status];
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="group"
                      >
                        <td className="py-4 pr-4">
                          <span className="font-bold text-sm text-slate-800">{inv.email}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-sm font-bold text-slate-500">{formatDate(inv.created_at)}</td>
                        <td className="py-4 pr-4 text-sm font-bold text-slate-500">{formatDate(inv.expires_at)}</td>
                        <td className="py-4 text-sm font-bold text-slate-500">
                          {inv.used_at ? formatDate(inv.used_at) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-4 pl-4">
                          {inv.status === "pendiente" ? (
                            <button
                              onClick={() => handleCopy(inv)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${copiedId === inv.id ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"}`}
                              title="Copiar link de invitación"
                            >
                              {copiedId === inv.id ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar link</>}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 pl-2">
                          <button
                            onClick={() => handleDelete(inv.id)}
                            disabled={deletingId === inv.id}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                            title="Eliminar invitación"
                          >
                            {deletingId === inv.id
                              ? <RefreshCw size={15} className="animate-spin" />
                              : <Trash2 size={15} />}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

type PaymentStatusFilter = "todos" | "pending" | "success" | "failed";

const PLAN_LABELS: Record<PlanType, string> = {
  "1m": "1 mes",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
  indefinido: "Indefinido",
};

const paymentStatusConfig: Record<Exclude<PaymentStatusFilter, "todos">, { label: string; icon: React.ReactNode; cls: string }> = {
  pending: { label: "Pendiente", icon: <Clock size={12} />, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  success: { label: "Aprobado", icon: <CheckCircle size={12} />, cls: "bg-green-50 text-green-700 border border-green-200" },
  failed:  { label: "Rechazado", icon: <XCircle size={12} />, cls: "bg-red-50 text-red-600 border border-red-200" },
};

function formatAmount(amount: number) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function PaymentsPanel() {
  const api = useApiFetch();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("todos");
  const [searchFilter, setSearchFilter] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api<Payment[]>("/api/payments/");
      setPayments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  async function handleApprove(id: string) {
    setActioningId(id);
    setError(null);
    try {
      const { data } = await api<Payment>(`/api/payments/${id}/approve`, { method: "PATCH" });
      setPayments((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al aprobar el pago");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: string) {
    setActioningId(id);
    setError(null);
    try {
      const { data } = await api<Payment>(`/api/payments/${id}/reject`, { method: "PATCH" });
      setPayments((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al rechazar el pago");
    } finally {
      setActioningId(null);
    }
  }

  async function handleViewReceipt(id: string) {
    setReceiptLoadingId(id);
    setError(null);
    try {
      const { data } = await api<{ url: string }>(`/api/payments/${id}/receipt`);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al obtener el comprobante");
    } finally {
      setReceiptLoadingId(null);
    }
  }

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    const haystack = `${p.user_name ?? ""} ${p.user_email ?? ""} ${p.reference_number}`.toLowerCase();
    const matchesSearch = haystack.includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    todos: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    success: payments.filter((p) => p.status === "success").length,
    failed: payments.filter((p) => p.status === "failed").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Banknote className="text-indigo-600" /> Pagos y Suscripciones
          </h3>
          <p className="text-slate-500 font-medium mt-1">{payments.length} pagos registrados en total</p>
        </div>
        <button onClick={loadPayments} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o referencia..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm font-bold transition-all outline-none"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit h-fit overflow-x-auto">
          {(["todos", "pending", "success", "failed"] as PaymentStatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${statusFilter === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {s === "todos" ? "Todos" : paymentStatusConfig[s].label}
              <span className={`ml-1.5 text-[10px] ${statusFilter === s ? "text-indigo-400" : "text-slate-400"}`}>
                ({counts[s]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 mb-4 flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {loading && payments.length === 0 ? (
        <div className="flex justify-center items-center py-16 text-slate-400">
          <RefreshCw size={24} className="animate-spin mr-3" />
          <span className="font-bold">Cargando pagos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Banknote size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No hay pagos{statusFilter !== "todos" ? ` con estado "${paymentStatusConfig[statusFilter].label.toLowerCase()}"` : ""}{searchFilter ? ` para "${searchFilter}"` : ""}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Usuario</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Plan</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Monto</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Referencia</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Estado</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Enviado</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] pb-4 pr-4">Comprobante</th>
                <th className="pb-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence initial={false}>
                {filtered.map((p) => {
                  const sc = paymentStatusConfig[p.status];
                  const isActioning = actioningId === p.id;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-bold text-sm text-slate-800">{p.user_name ?? "—"}</p>
                        <p className="text-xs font-medium text-slate-400">{p.user_email ?? "—"}</p>
                      </td>
                      <td className="py-4 pr-4 text-sm font-bold text-slate-600">{PLAN_LABELS[p.plan] ?? p.plan}</td>
                      <td className="py-4 pr-4 text-sm font-bold text-slate-600">{formatAmount(p.amount)}</td>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-bold text-slate-600">{p.reference_number}</p>
                        <p className="text-xs font-medium text-slate-400">{p.payment_method}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${sc.cls}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-sm font-bold text-slate-500">{formatDate(p.created_at)}</td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => handleViewReceipt(p.id)}
                          disabled={receiptLoadingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-50 text-slate-500 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-50"
                          title="Ver comprobante"
                        >
                          {receiptLoadingId === p.id ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                          Ver
                        </button>
                      </td>
                      <td className="py-4 pl-2">
                        {p.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={isActioning}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all disabled:opacity-40"
                              title="Aprobar pago"
                            >
                              {isActioning ? <RefreshCw size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={isActioning}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-40"
                              title="Rechazar pago"
                            >
                              {isActioning ? <RefreshCw size={12} className="animate-spin" /> : <ThumbsDown size={12} />}
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"stats" | "settings" | "invitaciones" | "pagos" | "gamification">("stats");
  const [bankInfo, setBankInfo] = useState({
    accountHolder: "Sarah Jenkins",
    bankName: "Global Bank",
    accountNumber: "**** **** **** 4562",
    routingNumber: "123456789",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
          <p className="text-slate-500 font-medium">Gestiona tu comunidad y finanzas desde un solo lugar.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab("invitaciones")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'invitaciones' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Invitaciones
          </button>
          <button
            onClick={() => setActiveTab("pagos")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'pagos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pagos
          </button>
          <button
            onClick={() => setActiveTab("gamification")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'gamification' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Niveles e Insignias
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Configuración
          </button>
        </div>
      </div>

      {activeTab === "stats" && <AnalyticsPanel />}

      {activeTab === "invitaciones" && <InvitationsPanel />}

      {activeTab === "pagos" && <PaymentsPanel />}

      {activeTab === "gamification" && <GamificationPanel />}

      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          {/* Bank Settings Cell */}
          <div className="md:col-span-12 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <CreditCard className="text-indigo-600" /> Información Bancaria
            </h3>
            <p className="text-slate-500 font-medium mb-10">Gestiona dónde recibes tus pagos y revisa tu estado de cuenta.</p>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Titular de la Cuenta</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={bankInfo.accountHolder}
                    onChange={(e) => setBankInfo({...bankInfo, accountHolder: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre del Banco</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Cuenta</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Ruta (SWIFT)</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={bankInfo.routingNumber}
                    onChange={(e) => setBankInfo({...bankInfo, routingNumber: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-6">
                <button
                  type="button"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  <Save size={20} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Cell */}
          <div className="md:col-span-12 bg-slate-50 border-2 border-slate-200 border-dashed rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Activity size={32} />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Estado de Cuenta Activo</h4>
                <p className="text-slate-500 font-medium">Tus pagos se procesan automáticamente cada lunes.</p>
              </div>
            </div>
            <button className="px-8 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-white transition-all">
              Ver Historial de Pagos
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
