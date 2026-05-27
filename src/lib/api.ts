export async function parseApiResponse<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    if (!res.ok) {
      throw new Error(`Error del servidor (${res.status})`);
    }
    return {} as T;
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "Respuesta inválida del servidor"
        : `Error del servidor (${res.status}): ${text.slice(0, 120)}`
    );
  }

  return data;
}

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ data: T; res: Response }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. ¿Está corriendo npm run dev en el puerto 3000?"
    );
  }

  const data = await parseApiResponse<T>(res);

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: string }).error)
        : `Error (${res.status})`;
    throw new Error(message);
  }

  return { data, res };
}
