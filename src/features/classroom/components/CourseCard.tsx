import React from "react";
import { Clock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Course } from "../../../types";

interface CourseCardProps {
  key?: React.Key;
  course: Course;
  index: number;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function CourseCard({ course, index, onClick, onEdit }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="w-full bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left group relative"
    >
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 w-full h-full z-10 focus:outline-none"
        tabIndex={-1}
        aria-label={`Ver curso ${course.title}`}
        style={{ background: "transparent", border: 0, padding: 0, margin: 0 }}
      />
      <div className="flex gap-0 sm:block">
        <div className="relative w-28 sm:w-full aspect-square sm:aspect-16/10 shrink-0 overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-black text-violet-700 uppercase tracking-wide">
            {course.category}
          </span>
        </div>

        <div className="flex-1 p-4 sm:p-5 min-w-0 flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Clock size={12} className="text-violet-500" />
            {course.module}
          </span>

          <h4 className="text-base font-black text-slate-900 mt-1 leading-snug group-hover:text-violet-700 transition-colors line-clamp-2">
            {course.title}
          </h4>

          <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
            {course.description}
          </p>

          <div className="mt-auto pt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-violet-600 tabular-nums">{course.progress}%</span>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-violet-500 shrink-0" />
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="ml-2 px-3 py-1 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs hover:bg-violet-200 transition-colors z-20"
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
