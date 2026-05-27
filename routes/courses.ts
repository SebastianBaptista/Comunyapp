// Editar curso
router.put("/:courseId", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId } = req.params;
  const { title, description, thumbnail, category } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El nombre del curso es requerido" });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "La descripción es requerida" });
  }
  if (!thumbnail || typeof thumbnail !== "string") {
    return res.status(400).json({ error: "La imagen del curso es requerida" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("courses")
      .update({
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        category: category?.trim() || "General",
      })
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating course:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(mapCourse(data));
  } catch (err) {
    console.error("PUT /api/courses/:courseId:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

// Editar capítulo
router.put("/:courseId/chapters/:chapterId", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId, chapterId } = req.params;
  const { title, videoUrl, duration } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El título del capítulo es requerido" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("course_chapters")
      .update({
        title: title.trim(),
        video_url: videoUrl?.trim() || null,
        duration: duration?.trim() || null,
      })
      .eq("id", chapterId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating chapter:", error.message);
      return res.status(500).json({ error: error.message });
    }

    await syncCourseModuleLabel(courseId);
    res.json(mapChapter(data));
  } catch (err) {
    console.error("PUT /api/courses/:courseId/chapters/:chapterId:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

import { Router } from "express";
import { isSupabaseConfigured, supabaseConfigError } from "../lib/env";
import { getSupabase } from "../lib/supabase";

const router = Router();

// Editar curso
router.put("/:courseId", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId } = req.params;
  const { title, description, thumbnail, category } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El nombre del curso es requerido" });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "La descripción es requerida" });
  }
  if (!thumbnail || typeof thumbnail !== "string") {
    return res.status(400).json({ error: "La imagen del curso es requerida" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("courses")
      .update({
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        category: category?.trim() || "General",
      })
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating course:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(mapCourse(data));
  } catch (err) {
    console.error("PUT /api/courses/:courseId:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

// Editar capítulo
router.put("/:courseId/chapters/:chapterId", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId, chapterId } = req.params;
  const { title, videoUrl, duration } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El título del capítulo es requerido" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("course_chapters")
      .update({
        title: title.trim(),
        video_url: videoUrl?.trim() || null,
        duration: duration?.trim() || null,
      })
      .eq("id", chapterId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating chapter:", error.message);
      return res.status(500).json({ error: error.message });
    }

    await syncCourseModuleLabel(courseId);
    res.json(mapChapter(data));
  } catch (err) {
    console.error("PUT /api/courses/:courseId/chapters/:chapterId:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

function mapCourse(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    category: String(row.category ?? "General"),
    module: String(row.module ?? "Sin capítulos"),
    progress: Number(row.progress ?? 0),
    description: String(row.description ?? ""),
    thumbnail: String(row.thumbnail ?? ""),
  };
}

function mapChapter(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    title: String(row.title ?? ""),
    videoUrl: row.video_url ? String(row.video_url) : null,
    duration: row.duration ? String(row.duration) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function supabaseErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "SUPABASE_NOT_CONFIGURED") return supabaseConfigError();
    if (err.message.includes("fetch failed")) return supabaseConfigError();
    return err.message;
  }
  return "Error de base de datos";
}

async function syncCourseModuleLabel(courseId: string) {
  const supabase = getSupabase();
  const { data: chapters } = await supabase
    .from("course_chapters")
    .select("title")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const label =
    !chapters?.length
      ? "Sin capítulos"
      : chapters.length === 1
        ? chapters[0].title
        : `${chapters.length} capítulos`;

  await supabase.from("courses").update({ module: label }).eq("id", courseId);
}

router.get("/", async (_req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json((data ?? []).map(mapCourse));
  } catch (err) {
    console.error("GET /api/courses:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

router.post("/thumbnail", async (req, res) => {
  const { imageData } = req.body;

  if (!imageData || typeof imageData !== "string") {
    return res.status(400).json({ error: "imageData es requerido" });
  }

  const matches = imageData.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: "Formato de imagen inválido" });
  }

  // Sin Supabase: guardar la imagen como data URL (máx. ~800 KB)
  if (!isSupabaseConfigured()) {
    if (imageData.length > 800_000) {
      return res.status(503).json({ error: supabaseConfigError() });
    }
    return res.json({ url: imageData, storage: "inline" });
  }

  try {
    const supabase = getSupabase();
    const buffer = Buffer.from(matches[2], "base64");
    const filePath = `course-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("Avatars")
      .upload(filePath, buffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError.message);
      if (imageData.length <= 800_000) {
        return res.json({ url: imageData, storage: "inline", warning: uploadError.message });
      }
      return res.status(500).json({
        error: `No se pudo subir la imagen: ${uploadError.message}. Crea el bucket "Avatars" en Supabase Storage.`,
      });
    }

    const { data: publicData } = supabase.storage.from("Avatars").getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      return res.status(500).json({ error: "No se pudo generar la URL de la imagen" });
    }

    res.json({ url: publicData.publicUrl, storage: "supabase" });
  } catch (err) {
    console.error("POST /api/courses/thumbnail:", err);
    if (imageData.length <= 800_000) {
      return res.json({ url: imageData, storage: "inline" });
    }
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

router.post("/", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { title, description, thumbnail, userId, category } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El nombre del curso es requerido" });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "La descripción es requerida" });
  }
  if (!thumbnail || typeof thumbnail !== "string") {
    return res.status(400).json({ error: "La imagen del curso es requerida" });
  }

  const payload: Record<string, unknown> = {
    title: title.trim(),
    description: description.trim(),
    thumbnail,
    category: category?.trim() || "General",
    module: "Sin capítulos",
    progress: 0,
  };

  try {
    const supabase = getSupabase();
    let insertPayload = { ...payload };
    if (userId) {
      insertPayload.created_by = userId;
    }

    let { data, error } = await supabase.from("courses").insert(insertPayload).select().single();

    if (error?.message?.includes("created_by")) {
      const { created_by: _, ...withoutCreator } = insertPayload;
      ({ data, error } = await supabase.from("courses").insert(withoutCreator).select().single());
    }

    if (error) {
      console.error("Error creating course:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(mapCourse(data));
  } catch (err) {
    console.error("POST /api/courses:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

router.get("/:courseId/chapters", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId } = req.params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("course_chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching chapters:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json((data ?? []).map(mapChapter));
  } catch (err) {
    console.error("GET chapters:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

router.post("/:courseId/chapters", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: supabaseConfigError() });
  }

  const { courseId } = req.params;
  const { title, videoUrl, duration } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "El título del capítulo es requerido" });
  }

  try {
    const supabase = getSupabase();
    const { count } = await supabase
      .from("course_chapters")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    const { data, error } = await supabase
      .from("course_chapters")
      .insert({
        course_id: courseId,
        title: title.trim(),
        video_url: videoUrl?.trim() || null,
        duration: duration?.trim() || null,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chapter:", error.message);
      return res.status(500).json({ error: error.message });
    }

    await syncCourseModuleLabel(courseId);

    res.status(201).json(mapChapter(data));
  } catch (err) {
    console.error("POST chapters:", err);
    res.status(500).json({ error: supabaseErrorMessage(err) });
  }
});

export default router;
