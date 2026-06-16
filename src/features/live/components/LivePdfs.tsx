import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useApiFetch } from "../../../lib/api";

interface LivePdf {
  id: string;
  title: string;
  url: string;
  filename: string;
  createdAt: string;
}

interface LivePdfsProps {
  liveId: string;
  isAdmin: boolean;
}

export default function LivePdfs({ liveId, isAdmin }: LivePdfsProps) {
  const [pdfs, setPdfs] = useState<LivePdf[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const api = useApiFetch();

  const fetchPdfs = useCallback(async () => {
    try {
      const { data } = await api<LivePdf[]>(`/api/lives/${liveId}/pdfs`);
      setPdfs(data);
    } catch (err) {
      console.error("[LivePdfs] fetch error:", err);
    }
  }, [api, liveId]);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadTitle.trim()) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data } = await api<LivePdf>(`/api/admin/lives/${liveId}/pdfs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          filename: file.name,
          fileData: base64,
        }),
      });

      setPdfs((prev) => [...prev, data]);
      setUploadTitle("");
      setShowUploadForm(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("[LivePdfs] upload error:", err);
      alert("Error al subir el PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (pdfId: string) => {
    if (!window.confirm("¿Eliminar este archivo?")) return;
    try {
      await api(`/api/admin/lives/${liveId}/pdfs/${pdfId}`, { method: "DELETE" });
      setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
    } catch (err) {
      console.error("[LivePdfs] delete error:", err);
      alert("Error al eliminar el archivo");
    }
  };

  if (pdfs.length === 0 && !isAdmin) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          Contenido complementario
        </h4>
        {isAdmin && !showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
          >
            <Upload size={12} /> Subir PDF
          </button>
        )}
      </div>

      {/* Upload form (admin only) */}
      {isAdmin && showUploadForm && (
        <form onSubmit={handleUpload} className="mb-3 space-y-2">
          <input
            type="text"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Nombre del documento"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 transition-colors"
            required
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowUploadForm(false); setUploadTitle(""); }}
              className="flex-1 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
            >
              {isUploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : "Subir"}
            </button>
          </div>
        </form>
      )}

      {/* PDF list */}
      {pdfs.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium">No hay documentos disponibles aún.</p>
      ) : (
        <ul className="space-y-2">
          {pdfs.map((pdf) => (
            <li key={pdf.id} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{pdf.title}</p>
                <p className="text-[10px] text-slate-400">{pdf.filename}</p>
              </div>
              <a
                href={pdf.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Abrir"
              >
                <ExternalLink size={14} />
              </a>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(pdf.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
