import React, { useState, useMemo } from "react";
import { ArrowLeft, PlayCircle, CheckCircle } from "lucide-react";
import { Course } from "../../../types";
import { motion } from "motion/react";
import { useCourseChapters } from "../hooks/useCourseChapters";
import AddChapterForm from "./AddChapterForm";

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onCourseUpdated?: () => void;
  onEdit?: () => void;
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/embed")) return url;
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

export default function CourseDetail({ course, onBack, onCourseUpdated, onEdit }: CourseDetailProps) {
  const { chapters, isLoading, refetch } = useCourseChapters(course.id);
  const [activeModule, setActiveModule] = useState(0);

  const playable = useMemo(
    () => chapters.filter((ch) => ch.videoUrl),
    [chapters]
  );

  const activeVideo = playable[activeModule]?.videoUrl
    ? toEmbedUrl(playable[activeModule].videoUrl!)
    : null;

  const handleChapterAdded = () => {
    refetch();
    onCourseUpdated?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto lg:max-w-4xl space-y-5 pb-4"
    >

      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition-colors text-sm"
        >
          <ArrowLeft size={18} /> Volver a cursos
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="ml-2 px-3 py-1 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs hover:bg-orange-200 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {activeVideo ? (
        <div className="rounded-3xl overflow-hidden aspect-video shadow-lg border-2 border-orange-100 bg-slate-900 relative">
          <iframe
            src={activeVideo}
            title={playable[activeModule]?.title ?? course.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden aspect-video border-2 border-orange-100 bg-slate-100 flex items-center justify-center">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      )}

      <div className="rounded-3xl border-2 border-orange-200 bg-sky-50/80 p-5 shadow-sm">
        <span className="inline-flex px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
          {course.category}
        </span>
        <h1 className="text-xl font-black text-slate-900 mt-3 leading-tight">{course.title}</h1>
        <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">{course.description}</p>
      </div>

      <section className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900">Capítulos</h3>

        {isLoading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chapters.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">
            Este curso aún no tiene capítulos. Añade el primero abajo.
          </p>
        ) : (
          <div className="space-y-2">
            {chapters.map((ch) => {
              const playableIndex = playable.findIndex((p) => p.id === ch.id);
              const isActive = playableIndex >= 0 && playableIndex === activeModule;
              const hasVideo = Boolean(ch.videoUrl);

              return (
                <button
                  key={ch.id}
                  type="button"
                  disabled={!hasVideo}
                  onClick={() => {
                    if (playableIndex >= 0) setActiveModule(playableIndex);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                    isActive
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-slate-100 hover:border-orange-200 bg-white"
                  } ${!hasVideo ? "opacity-80" : ""}`}
                >
                  <div className={`mt-0.5 ${isActive ? "text-emerald-500" : "text-slate-400"}`}>
                    {isActive ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-bold text-sm ${isActive ? "text-orange-900" : "text-slate-700"}`}
                    >
                      {ch.title}
                    </h4>
                    {ch.duration && (
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {ch.duration}
                      </p>
                    )}
                    {!hasVideo && (
                      <p className="text-xs text-slate-400 mt-1">Sin video enlazado</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <AddChapterForm courseId={course.id} onAdded={handleChapterAdded} />
      </section>
    </motion.div>
  );
}
