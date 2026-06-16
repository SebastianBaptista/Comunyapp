import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Pin, Pencil, Trash2, X, Check } from "lucide-react";
import { useApiFetch, API_BASE } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { isAdmin } from "../../../lib/permissions";

interface ChatMessage {
  id: string;
  liveId: string;
  userId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  isPinned?: boolean;
  author: {
    name: string;
    avatar?: string | null;
    role: string;
  };
}

type WsEvent =
  | ({ type: "new_message" } & ChatMessage)
  | { type: "edit_message"; id: string; content: string; editedAt: string }
  | { type: "delete_message"; id: string }
  | { type: "pin_message"; id: string; isPinned: boolean };

interface LiveChatProps {
  liveId: string;
}

function buildWsUrl(liveId: string, token: string): string {
  const base = API_BASE || "";
  const wsBase = base
    ? base.replace(/^https/, "wss").replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  return `${wsBase}/api/lives/${liveId}/chat/ws?token=${encodeURIComponent(token)}`;
}

function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 object-cover`;
  if (avatar) return <img src={avatar} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0`}>
      {name?.charAt(0).toUpperCase() ?? "U"}
    </div>
  );
}

export default function LiveChat({ liveId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const api = useApiFetch();
  const { user, token } = useAuth();
  const userIsAdmin = isAdmin(user?.role);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api<ChatMessage[]>(`/api/lives/${liveId}/chat?limit=100`);
      setMessages(data);
      const pinned = data.find((m) => m.isPinned);
      setPinnedMessage(pinned ?? null);
    } catch (err) {
      console.error("[LiveChat] fetchHistory error:", err);
    }
  }, [api, liveId]);

  // WebSocket con reconexión y manejo de mensajes tipados
  useEffect(() => {
    if (!token) return;

    let mounted = true;
    fetchHistory();

    function connect() {
      if (!mounted || !token) return;

      const ws = new WebSocket(buildWsUrl(liveId, token));
      wsRef.current = ws;

      ws.onopen = () => { if (mounted) setConnected(true); };

      ws.onmessage = (event) => {
        if (!mounted) return;
        let payload: WsEvent;
        try { payload = JSON.parse(event.data); } catch { return; }

        if (payload.type === "new_message") {
          const msg = payload as ChatMessage & { type: string };
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith("temp-") && m.content === msg.content && m.userId === msg.userId
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = msg;
              return next;
            }
            return [...prev, msg];
          });
        } else if (payload.type === "edit_message") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.id
                ? { ...m, content: payload.content, editedAt: payload.editedAt }
                : m
            )
          );
        } else if (payload.type === "delete_message") {
          setMessages((prev) => prev.filter((m) => m.id !== payload.id));
          setPinnedMessage((p) => (p?.id === payload.id ? null : p));
        } else if (payload.type === "pin_message") {
          setMessages((prev) =>
            prev.map((m) => ({
              ...m,
              isPinned: m.id === payload.id ? payload.isPinned : false,
            }))
          );
          if (payload.isPinned) {
            setMessages((prev) => {
              const pinned = prev.find((m) => m.id === payload.id);
              setPinnedMessage(pinned ?? null);
              return prev;
            });
          } else {
            setPinnedMessage(null);
          }
        }
      };

      ws.onclose = (e) => {
        if (!mounted) return;
        setConnected(false);
        if (e.code !== 1000) setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      mounted = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [liveId, token]);

  // Polling fallback
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [connected, fetchHistory]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const optimistic: ChatMessage = {
      id: "temp-" + Date.now(),
      liveId,
      userId: user?.id || "",
      content,
      createdAt: new Date().toISOString(),
      author: { name: user?.name || "Usuario", avatar: user?.avatar, role: user?.role || "miembro" },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await api(`/api/lives/${liveId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error("[LiveChat] Error al enviar:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleEditSave = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      await api(`/api/admin/lives/${liveId}/chat/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setEditingId(null);
    } catch (err) {
      console.error("[LiveChat] Error al editar:", err);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    try {
      await api(`/api/admin/lives/${liveId}/chat/${msgId}`, { method: "DELETE" });
    } catch (err) {
      console.error("[LiveChat] Error al eliminar:", err);
    }
  };

  const handlePin = async (msg: ChatMessage) => {
    const newPinned = !msg.isPinned;
    try {
      await api(`/api/admin/lives/${liveId}/chat/${msg.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newPinned }),
      });
    } catch (err) {
      console.error("[LiveChat] Error al destacar:", err);
    }
  };

  return (
    <div className="flex flex-col h-[55vh] lg:h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
        <h3 className="font-black text-slate-900 text-sm">Chat en vivo</h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full transition-colors ${connected ? "bg-green-400" : "bg-slate-300"}`} />
          <span className="text-[10px] font-bold text-slate-400">{connected ? "En vivo" : "Reconectando..."}</span>
        </div>
      </div>

      {/* Pinned message banner */}
      {pinnedMessage && (
        <div className="mx-3 mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 shrink-0">
          <Pin size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Destacado</span>
            <p className="text-xs text-slate-700 font-medium truncate">{pinnedMessage.content}</p>
            <p className="text-[10px] text-slate-400">{pinnedMessage.author.name}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <p className="text-center text-xs font-bold text-slate-400 mt-10">No hay mensajes aún. ¡Sé el primero en saludar!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="group flex gap-3">
              <Avatar name={msg.author?.name} avatar={msg.author?.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs">{msg.author?.name}</span>
                  {msg.author?.role === "admin" && (
                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                  )}
                  {msg.isPinned && <Pin size={10} className="text-amber-500" />}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {msg.editedAt && <span className="ml-1 italic">(editado)</span>}
                  </span>
                </div>

                {editingId === msg.id ? (
                  <div className="flex gap-1 mt-1">
                    <input
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(msg.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-violet-400"
                    />
                    <button onClick={() => handleEditSave(msg.id)} className="p-1 text-green-600 hover:text-green-700"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                ) : (
                  <p className={`text-sm break-words mt-0.5 ${msg.id.startsWith("temp-") ? "text-slate-400" : "text-slate-600"}`}>
                    {msg.content}
                  </p>
                )}
              </div>

              {/* Admin controls — visibles en hover */}
              {userIsAdmin && editingId !== msg.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {msg.userId === user?.id && (
                    <button
                      onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => handlePin(msg)}
                    className={`p-1.5 rounded-lg hover:bg-amber-50 transition-colors ${msg.isPinned ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                    title={msg.isPinned ? "Quitar destacado" : "Destacar"}
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 pr-2 focus-within:ring-2 focus-within:ring-violet-200 transition-shadow">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 outline-none"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 rounded-xl bg-[#ae3df7] text-white hover:bg-[#921be2] disabled:opacity-50 disabled:grayscale transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
