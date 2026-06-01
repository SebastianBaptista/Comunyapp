export type Role = "admin" | "miembro" | "invitado";

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function requireAdmin(role: string | undefined, action = "realizar esta acción"): boolean {
  if (isAdmin(role)) return true;
  alert(`Solo los administradores pueden ${action}.`);
  return false;
}
