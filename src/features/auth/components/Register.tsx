import React, { useEffect, useState } from "react";
import {
  Mail, Lock, User, Sparkles, Phone, Hash, CreditCard, Upload,
  CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiFetch } from "../../../lib/api";
import type { PaymentMethod, PlanType } from "../../../types";
import logo from "../../../assets/logo.png";

interface RegisterProps {
  onGoToLogin: () => void;
}

const PLAN_OPTIONS: { value: PlanType; label: string; sublabel: string; price: string }[] = [
  { value: "1m", label: "1 mes", sublabel: "Acceso mensual", price: "25" },
  // { value: "3m", label: "3 meses", sublabel: "Plan trimestral", price: "" },   // oculto temporalmente
  // { value: "6m", label: "6 meses", sublabel: "Plan semestral", price: "" },    // oculto temporalmente
  { value: "1y", label: "1 año", sublabel: "Plan anual", price: "197" },
  // { value: "indefinido", label: "Indefinido", sublabel: "Pago único, sin vencimiento", price: "" }, // oculto temporalmente
];

const COUNTRY_CODES: { flag: string; code: string; name: string; digits: number }[] = [
  { flag: "🇻🇪", code: "+58",  name: "Venezuela",      digits: 10 },
  { flag: "🇺🇸", code: "+1",   name: "EE.UU.",         digits: 10 },
  { flag: "🇲🇽", code: "+52",  name: "México",         digits: 10 },
  { flag: "🇨🇴", code: "+57",  name: "Colombia",       digits: 10 },
  { flag: "🇦🇷", code: "+54",  name: "Argentina",      digits: 10 },
  { flag: "🇵🇪", code: "+51",  name: "Perú",           digits: 9  },
  { flag: "🇨🇱", code: "+56",  name: "Chile",          digits: 9  },
  { flag: "🇪🇸", code: "+34",  name: "España",         digits: 9  },
  { flag: "🇵🇦", code: "+507", name: "Panamá",         digits: 8  },
  { flag: "🇩🇴", code: "+1",   name: "Rep. Dominicana",digits: 10 },
];

const ALPHANUMERIC_RE = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

type Step = 1 | 2 | 3;

const inputClass =
  "w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1";

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl"
    >
      {message}
    </motion.p>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
    >
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-slate-800 mt-0.5">{value}</p>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
        copied
          ? "bg-emerald-100 text-emerald-600"
          : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
      }`}>
        {copied ? "✓ Copiado" : "Copiar"}
      </span>
    </button>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Tus datos" },
    { n: 2, label: "Plan y pago" },
    { n: 3, label: "Comprobante" },
  ];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === s.n
                  ? "bg-indigo-600 text-white"
                  : step > s.n
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.n ? <CheckCircle2 size={16} /> : s.n}
            </div>
            <span className={`text-xs font-black hidden sm:inline ${step === s.n ? "text-slate-900" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step > s.n ? "bg-indigo-200" : "bg-slate-100"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function SuccessScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-sm text-center"
      >
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock size={32} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Tu registro está en revisión</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          Creamos tu cuenta y recibimos tu comprobante de pago. Un administrador lo revisará
          pronto y activará tu acceso. Te notificaremos por email cuando esté listo — también
          puedes iniciar sesión para ver el estado de tu suscripción.
        </p>
        <button
          onClick={onGoToLogin}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
        >
          Ir a iniciar sesión <Sparkles size={18} />
        </button>
      </motion.div>
    </div>
  );
}

export default function Register({ onGoToLogin }: RegisterProps) {
  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Paso 1 — datos personales
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Paso 2 — plan y datos de pago
  const [plan, setPlan] = useState<PlanType>("1m");
  const [amount, setAmount] = useState("25");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [phone, setPhone] = useState("");

  // Métodos de pago activos (catálogo público)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  // Paso 3 — comprobante
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptPath, setReceiptPath] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentMethods() {
      setMethodsLoading(true);
      setMethodsError(null);
      try {
        const { data } = await apiFetch<PaymentMethod[]>("/api/payment-methods/");
        if (cancelled) return;
        setPaymentMethods(data);
        setSelectedMethodId((prev) => prev || data[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setMethodsError(err instanceof Error ? err.message : "No se pudieron cargar los métodos de pago.");
        }
      } finally {
        if (!cancelled) setMethodsLoading(false);
      }
    }
    loadPaymentMethods();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tasa BCV
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [bcvLoading, setBcvLoading] = useState(true);

  useEffect(() => {
    fetch("https://ve.dolarapi.com/v1/dolares/oficial")
      .then((r) => r.json())
      .then((data) => {
        if (data?.promedio) {
          setBcvRate(data.promedio);
          // Pre-fill amount in Bs for the default plan (1m = $25)
          setAmount((25 * data.promedio).toFixed(2));
        }
      })
      .catch(() => { /* si falla la API, el campo quedará editable */ })
      .finally(() => setBcvLoading(false));
  }, []);

  // Bs equivalente del plan seleccionado
  const selectedPlan = PLAN_OPTIONS.find((p) => p.value === plan);
  const bsAmount = bcvRate && selectedPlan ? (parseFloat(selectedPlan.price) * bcvRate).toFixed(2) : null;

  function goToStep(target: Step) {
    setStepError(null);
    setStep(target);
  }

  function handleNextFromStep1() {
    if (!name.trim() || !email.trim() || !password) {
      setStepError("Completa todos los campos para continuar.");
      return;
    }
    if (password.length < 6) {
      setStepError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!ALPHANUMERIC_RE.test(password)) {
      setStepError("La contraseña debe contener letras y números (alfanumérica).");
      return;
    }
    goToStep(2);
  }

  function handleNextFromStep2() {
    if (!amount.trim() || !selectedMethodId || !referenceNumber.trim() || !phone.trim()) {
      setStepError("Completa todos los campos del pago para continuar.");
      return;
    }
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== selectedCountry.digits) {
      setStepError(`El teléfono para ${selectedCountry.name} debe tener exactamente ${selectedCountry.digits} dígitos.`);
      return;
    }
    if (countryCode === "+58" && !/^(04[1-9]|02[0-9])/.test(digitsOnly)) {
      setStepError("El teléfono venezolano debe empezar con 04XX o 02X (ej. 0412, 0414, 0424, 0426).");
      return;
    }
    goToStep(3);
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_RECEIPT_SIZE) {
      setUploadError("El archivo es demasiado grande (máximo 5MB).");
      return;
    }

    setUploadError(null);
    setIsUploadingReceipt(true);
    setReceiptPath("");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const { data } = await apiFetch<{ path: string }>("/api/payments/upload-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber.trim(),
            filename: file.name,
            fileData: dataUrl,
          }),
        });
        setReceiptPath(data.path);
        setReceiptFileName(file.name);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Error al subir el comprobante");
      } finally {
        setIsUploadingReceipt(false);
      }
    };
    reader.onerror = () => {
      setUploadError("No se pudo leer el archivo.");
      setIsUploadingReceipt(false);
    };
    reader.readAsDataURL(file);
  }

  function clearReceipt() {
    setReceiptPath("");
    setReceiptFileName("");
    setUploadError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptPath) {
      setSubmitError("Sube tu comprobante de pago antes de finalizar.");
      return;
    }
    if (!selectedMethodId) {
      setSubmitError("Selecciona un método de pago.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/api/payments/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          plan,
          amount: Number(bsAmount ?? amount),
          payment_method_id: selectedMethodId,
          reference_number: referenceNumber.trim(),
          phone: `${countryCode}${phone.trim()}`,
          receipt_path: receiptPath,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al registrar tu pago. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return <SuccessScreen onGoToLogin={onGoToLogin} />;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm"
      >
        <div className="mb-2 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">Crea tu cuenta</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Regístrate y envía tu comprobante de pago para activar tu acceso.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <StepIndicator step={step} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className={labelClass}>Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className={inputClass} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={inputClass} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres, letras y números"
                    className={inputClass}
                  />
                </div>
                {/* Password strength hints */}
                {password.length > 0 && (
                  <div className="flex gap-3 mt-1 ml-1">
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      password.length >= 6 ? "text-emerald-500" : "text-slate-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? "bg-emerald-500" : "bg-slate-200"}`} />
                      6+ caracteres
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      /[a-zA-Z]/.test(password) ? "text-emerald-500" : "text-slate-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/[a-zA-Z]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                      Letras
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      /[0-9]/.test(password) ? "text-emerald-500" : "text-slate-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                      Números
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className={labelClass}>Plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {PLAN_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setPlan(p.value);
                        const bs = bcvRate ? (parseFloat(p.price) * bcvRate).toFixed(2) : p.price;
                        setAmount(bs);
                      }}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        plan === p.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <p className={`font-black text-sm ${plan === p.value ? "text-indigo-600" : "text-slate-800"}`}>{p.label}</p>
                      <p className={`font-black text-lg mt-1 ${plan === p.value ? "text-indigo-700" : "text-slate-900"}`}>
                        ${p.price} <span className="text-xs font-medium text-slate-400">USD</span>
                      </p>
                      {bcvRate ? (
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          Bs. {(parseFloat(p.price) * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      ) : null}
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{p.sublabel}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Monto a pagar (Bs.)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  {bcvLoading ? (
                    <div className={`${inputClass} flex items-center text-slate-400`}>
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin mr-2" />
                      Calculando...
                    </div>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={bsAmount ? `Bs. ${parseFloat(bsAmount).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : amount}
                      className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-600 font-bold select-none`}
                      title="El monto es calculado automáticamente según la tasa BCV"
                    />
                  )}
                </div>
                {bcvRate && (
                  <p className="text-[10px] text-slate-400 font-medium ml-1">
                    Tasa BCV: 1 USD = Bs. {bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Método de pago</label>
                {methodsLoading ? (
                  <p className="text-sm font-medium text-slate-400 bg-slate-50 px-4 py-3 rounded-xl">Cargando métodos de pago...</p>
                ) : methodsError ? (
                  <FieldError message={methodsError} />
                ) : paymentMethods.length === 0 ? (
                  <p className="text-sm font-medium text-slate-400 bg-slate-50 px-4 py-3 rounded-xl">
                    No hay métodos de pago disponibles por el momento.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${
                          selectedMethodId === m.id
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <p className={`font-black text-sm ${selectedMethodId === m.id ? "text-indigo-600" : "text-slate-800"}`}>{m.name}</p>
                        {m.description && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{m.description}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMethod && selectedMethod.fields.length > 0 && (
                <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 space-y-2">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CreditCard size={11} /> Datos para tu pago
                  </p>
                  {selectedMethod.fields.map((f) => (
                    <CopyField key={f.field_key} label={f.field_label} value={f.value ?? "—"} />
                  ))}
                  <p className="text-[10px] text-indigo-400 font-medium pt-1 pl-1">
                    💡 Toca cualquier campo para copiarlo al portapapeles
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelClass}>Número de referencia</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" required value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Ej. 0001234567" className={inputClass} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Teléfono</label>
                  <div className="flex gap-2">
                    {/* Country selector */}
                    <select
                      value={countryCode}
                      onChange={(e) => { setCountryCode(e.target.value); setPhone(""); }}
                      className="shrink-0 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-4 px-3 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                      style={{ minWidth: "90px" }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.name}-${c.code}`} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    {/* Number input */}
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder={countryCode === "+58" ? "04121234567" : "Número sin prefijo"}
                        maxLength={11}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {countryCode === "+58" && (
                    <p className="text-[10px] text-slate-400 font-medium ml-1">
                      Venezuela: 0412, 0414, 0416, 0424, 0426 + 7 dígitos
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs font-medium text-slate-400 bg-slate-50 px-4 py-3 rounded-xl">
                Usaremos tu número de referencia para asociar tu comprobante — asegúrate de que coincida con el de tu pago.
              </p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className={labelClass}>Comprobante de pago</label>

                {!receiptFileName ? (
                  <label
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-12 px-6 cursor-pointer transition-all ${
                      isUploadingReceipt ? "border-slate-200 bg-slate-50 cursor-wait" : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                    }`}
                  >
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptChange} disabled={isUploadingReceipt} />
                    {isUploadingReceipt ? (
                      <>
                        <span className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-500">Subiendo comprobante...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                          <Upload size={22} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">Sube una imagen o PDF de tu comprobante</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">Tamaño máximo 5MB</p>
                        </div>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-4 border-2 border-green-100 bg-green-50 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{receiptFileName}</p>
                        <p className="text-xs font-medium text-green-600 flex items-center gap-1.5"><CheckCircle2 size={12} /> Comprobante subido</p>
                      </div>
                    </div>
                    <button type="button" onClick={clearReceipt} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-white transition-all flex-shrink-0" title="Quitar archivo">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <FieldError message={uploadError} />
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Resumen de tu solicitud</p>
                {[
                  ["Plan", PLAN_OPTIONS.find((p) => p.value === plan)?.label ?? plan],
                  ["Monto", amount],
                  ["Método de pago", selectedMethod?.name ?? ""],
                  ["Referencia", referenceNumber],
                  ["Teléfono", phone],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-400">{k}</span>
                    <span className="font-bold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-medium text-slate-400 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl">
                Tu cuenta se creará de inmediato, pero tu acceso quedará pendiente hasta que un administrador apruebe tu pago.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <FieldError message={stepError} />
        <FieldError message={submitError} />

        <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goToStep((step - 1) as Step)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={18} /> Atrás
            </button>
          ) : (
            <button onClick={onGoToLogin} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              ¿Ya tienes cuenta? <span className="text-indigo-600">Inicia sesión</span>
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? handleNextFromStep1 : handleNextFromStep2}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
              Continuar <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !receiptPath}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Finalizar registro <Sparkles size={18} /></>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
