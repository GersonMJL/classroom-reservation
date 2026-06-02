// frontend/app/ui/NavConfig.ts
export type Role = "admin" | "manager" | "technician" | "requester";

export type NavItem = {
  path: string;
  label: string;
  group: "primary" | "operations" | "governance";
  requiresAuth: boolean;
  roles?: Role[]; // se vazio/ausente, qualquer autenticado
};

export const NAV_ITEMS: NavItem[] = [
  { path: "/reservas",              label: "Reservas",        group: "primary",    requiresAuth: true },
  { path: "/environments",          label: "Ambientes",       group: "primary",    requiresAuth: true },
  { path: "/resources",             label: "Recursos",        group: "primary",    requiresAuth: true },
  // { path: "/purposes",              label: "Finalidades",     group: "primary",    requiresAuth: true },
  { path: "/organizational-units",  label: "Unidades Org.",   group: "primary",    requiresAuth: true },
  { path: "/qualifications",        label: "Qualificações",   group: "primary",    requiresAuth: true },
  { path: "/aprovacoes",            label: "Aprovações",      group: "operations", requiresAuth: true, roles: ["admin", "manager"] },
  { path: "/bloqueios",             label: "Bloqueios",       group: "operations", requiresAuth: true, roles: ["admin", "manager", "technician"] },
  { path: "/incidentes",            label: "Incidentes",      group: "operations", requiresAuth: true, roles: ["admin", "manager", "technician"] },
  { path: "/penalidades",           label: "Penalidades",     group: "governance", requiresAuth: true },
  { path: "/auditoria",             label: "Auditoria",       group: "governance", requiresAuth: true, roles: ["admin", "manager"] },
  { path: "/users",                 label: "Usuários",        group: "governance", requiresAuth: true, roles: ["admin"] },
];

export function filterNavForRoles(roles: string[], isAuthenticated: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles && !item.roles.some((r) => roles.includes(r))) return false;
    return true;
  });
}
