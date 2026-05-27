import { useState, useEffect, useCallback } from "react";
import { Course } from "../../../types";
import { apiFetch } from "../../../lib/api";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(() => {
    setIsLoading(true);
    setError(null);

    apiFetch<Course[] | { error: string }>("/api/courses")
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setError("No se pudieron cargar los cursos");
          setCourses([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "No se pudieron cargar los cursos");
        setCourses([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}
