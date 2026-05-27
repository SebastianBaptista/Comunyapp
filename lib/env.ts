export function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL?.trim() ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url || !serviceRoleKey) return false;
  if (url.includes("your-project-id") || serviceRoleKey.includes("your-service-role")) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function supabaseConfigError(): string {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url || !serviceRoleKey) {
    return "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local";
  }
  if (url.includes("your-project-id") || serviceRoleKey.includes("your-service-role")) {
    return "Configura Supabase en .env.local con tu URL y service_role key reales (Project Settings → API)";
  }
  return "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY";
}
