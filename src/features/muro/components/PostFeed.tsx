import { useRef, useEffect, useState } from "react";
import { usePosts } from "../hooks/usePosts";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import Spinner from "../../../shared/ui/Spinner";
import { API_BASE } from "../../../lib/api";

interface TagOption { id: string; name: string; }

export default function PostFeed() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagOption[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/tags`).then((r) => r.json()).then(setAllTags).catch(() => {});
  }, []);

  const toggleTag = (name: string) =>
    setSelectedTags((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);

  const { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost, reactToPost, deletePost, editPost, pinPost, incrementCommentCount } = usePosts(selectedTags);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);

  // Keep ref in sync without re-creating the observer
  useEffect(() => { loadMoreRef.current = loadMore; });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: "400px" } // preload 400px antes de llegar al fondo
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Welcome Cell */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">¡Bienvenido de nuevo!</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Comparte ideas, hace preguntas y conecta con tu comunidad.
          </p>
        </div>
        <div className="hidden sm:flex -space-x-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 shadow-sm overflow-hidden">
              <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
            </div>
          ))}
          <div className="w-12 h-12 rounded-full border-4 border-white bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white shadow-sm">
            +12
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="space-y-6">
        {/* Barra de filtro por tags */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtrar:</span>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedTags.includes(tag.name)
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                #{tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-red-400 hover:bg-red-50 transition-all"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        <CreatePost onSubmit={createPost} />

        {posts.map((post, idx) => (
          <PostCard
              key={post.id}
              post={post}
              index={idx}
              onReact={reactToPost}
              onDelete={deletePost}
              onEdit={editPost}
              onPin={pinPost}
              onCommentAdded={incrementCommentCount}
            />
        ))}

        {/* Sentinel: el observer dispara loadMore cuando este div entra en vista */}
        <div ref={sentinelRef} />

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-4">
            Has visto todos los posts
          </p>
        )}
      </div>
    </div>
  );
}
