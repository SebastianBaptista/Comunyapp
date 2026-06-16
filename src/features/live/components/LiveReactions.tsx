import { useState, useEffect, useCallback, useRef } from "react";
import { Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApiFetch } from "../../../lib/api";

interface ReactionData {
  reactions: Record<string, number>;
  userReaction: string | null;
}

interface LiveReactionsProps {
  liveId: string;
}

const REACTIONS = [
  { type: "like",  emoji: "👍" },
  { type: "love",  emoji: "❤️" },
  { type: "fire",  emoji: "🔥" },
  { type: "clap",  emoji: "👏" },
  { type: "wow",   emoji: "😮" },
];

export default function LiveReactions({ liveId }: LiveReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const api = useApiFetch();

  const totalLikes = Object.values(reactions).reduce((a, b) => a + b, 0);

  const fetchReactions = useCallback(async () => {
    try {
      const { data } = await api<ReactionData>(`/api/lives/${liveId}/reactions`);
      setReactions(data.reactions);
      setUserReaction(data.userReaction);
    } catch (err) {
      console.error("[LiveReactions] fetch error:", err);
    }
  }, [api, liveId]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  // Cerrar picker al hacer clic fuera
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleReact = async (type: string) => {
    if (isSending) return;
    setShowPicker(false);
    setIsSending(true);

    const prev = { reactions: { ...reactions }, userReaction };
    const isToggleOff = userReaction === type;

    // Optimistic
    if (isToggleOff) {
      setUserReaction(null);
      setReactions((r) => {
        const next = { ...r };
        if ((next[type] ?? 0) > 1) next[type]--;
        else delete next[type];
        return next;
      });
    } else {
      if (userReaction) {
        setReactions((r) => {
          const next = { ...r };
          if ((next[userReaction] ?? 0) > 1) next[userReaction]--;
          else delete next[userReaction];
          return next;
        });
      }
      setUserReaction(type);
      setReactions((r) => ({ ...r, [type]: (r[type] ?? 0) + 1 }));
    }

    try {
      const { data } = await api<ReactionData>(`/api/lives/${liveId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      });
      setReactions(data.reactions);
      setUserReaction(data.userReaction);
    } catch (err) {
      console.error("[LiveReactions] react error:", err);
      setReactions(prev.reactions);
      setUserReaction(prev.userReaction);
    } finally {
      setIsSending(false);
    }
  };

  const topEmojis = Object.entries(reactions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
    .join("");

  const selectedEmoji = REACTIONS.find((r) => r.type === userReaction)?.emoji;

  return (
    <div className="flex items-center gap-2">
      {/* Top reacciones + conteo */}
      {totalLikes > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">{topEmojis}</span>
          <span className={`text-sm font-bold ${userReaction ? "text-indigo-600" : "text-slate-400"}`}>
            {totalLikes}
          </span>
        </div>
      )}

      {/* Botón picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className={`flex items-center gap-1.5 transition-all font-bold text-sm ml-1 ${
            userReaction ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
          }`}
        >
          {selectedEmoji
            ? <span className="text-xl leading-none">{selectedEmoji}</span>
            : <Smile size={20} />
          }
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-10 right-0 flex gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1.5 shadow-lg z-10"
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReact(r.type)}
                  className={`text-2xl hover:scale-125 transition-transform p-0.5 rounded-lg ${
                    userReaction === r.type ? "bg-indigo-100" : ""
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
