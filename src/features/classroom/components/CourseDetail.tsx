import React, { useState } from "react";
import { ArrowLeft, PlayCircle, CheckCircle } from "lucide-react";
import { Course } from "../../../types";
import { motion } from "motion/react";

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

export default function CourseDetail({ course, onBack }: CourseDetailProps) {
  const [activeModule, setActiveModule] = useState(0);

  const modules = [
    {
      title: "Clase 1: Introducción",
      duration: "10:00",
      videoUrl: "https://www.youtube.com/embed/kW91PzomLWw?start=10",
      completed: true
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
      >
        <ArrowLeft size={20} /> Volver a cursos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#131b2e] rounded-[2rem] overflow-hidden aspect-video shadow-lg relative">
            <iframe
              src={modules[activeModule].videoUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            ></iframe>
          </div>
          
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900 mb-4">{course.title}</h1>
            <p className="text-slate-600 leading-relaxed font-medium">
              {course.description}
            </p>
          </div>
        </div>

        {/* Modules Sidebar */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-900 mb-6">Módulos del Curso</h3>
          
          <div className="space-y-4">
            {modules.map((mod, idx) => (
              <button
                key={idx}
                onClick={() => setActiveModule(idx)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4
                  ${activeModule === idx 
                    ? "border-indigo-600 bg-indigo-50" 
                    : "border-slate-100 hover:border-indigo-200 bg-white"}`}
              >
                <div className={`mt-1 ${mod.completed ? "text-green-500" : "text-slate-400"}`}>
                  {mod.completed ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                </div>
                <div>
                  <h4 className={`font-bold ${activeModule === idx ? "text-indigo-900" : "text-slate-700"}`}>
                    {mod.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    {mod.duration}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
