import { useState, useEffect, useCallback } from "react";
import { CourseChapter } from "../../../types";
import { apiFetch } from "../../../lib/api";

export function useCourseChapters(courseId: string) {
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapters = useCallback(() => {
    setIsLoading(true);
    setError(null);

    apiFetch<CourseChapter[]>(`/api/courses/${courseId}/chapters`)
      .then(({ data }) => {
        setChapters(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los capítulos");
        setChapters([]);
      })
      .finally(() => setIsLoading(false));
  }, [courseId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return { chapters, isLoading, error, refetch: fetchChapters };
}
