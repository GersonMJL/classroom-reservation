// frontend/app/ui/NavConfig.ts
export type Role =
  | "ADMIN"
  | "MANAGER"
  | "PROFESSOR"
  | "STUDENT"
  | "TECHNICIAN"
  | "REQUESTER"
  | "admin"
  | "manager"
  | "professor"
  | "student"
  | "technician"
  | "requester";

export type NavItem = {
  path: string;
  label: string;
  group: "primary" | "operations" | "governance";
  requiresAuth: boolean;
  roles?: string[]; // se vazio/ausente, qualquer autenticado
};

export const NAV_ITEMS: NavItem[] = [
  {
    path: "/reservas",
    label: "Minhas Reservas",
    group: "primary",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "PROFESSOR", "STUDENT", "TECHNICIAN", "REQUESTER"],
  },
  {
    path: "/environments",
    label: "Salas e Ambientes",
    group: "primary",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "PROFESSOR", "STUDENT", "TECHNICIAN", "REQUESTER"],
  },
  {
    path: "/resources",
    label: "Recursos e Equipamentos",
    group: "primary",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "PROFESSOR", "TECHNICIAN"],
  },
  {
    path: "/organizational-units",
    label: "Departamentos e Unidades",
    group: "primary",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/qualifications",
    label: "Qualificações",
    group: "primary",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "PROFESSOR"],
  },
  {
    path: "/aprovacoes",
    label: "Fila de Aprovações",
    group: "operations",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/bloqueios",
    label: "Bloqueios e Feriados",
    group: "operations",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
  {
    path: "/incidentes",
    label: "Ocorrências e Incidentes",
    group: "operations",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER", "TECHNICIAN", "PROFESSOR"],
  },
  {
    path: "/penalidades",
    label: "Governança e Penalidades",
    group: "governance",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/auditoria",
    label: "Logs de Auditoria",
    group: "governance",
    requiresAuth: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/users",
    label: "Gestão de Usuários",
    group: "governance",
    requiresAuth: true,
    roles: ["ADMIN"],
  },
];

export function filterNavForRoles(roles: string[] = [], isAuthenticated: boolean): NavItem[] {
  const normalizedUserRoles = roles.map((r) => r.toUpperCase());

  return NAV_ITEMS.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (!item.roles || item.roles.length === 0) return true;

    const normalizedItemRoles = item.roles.map((r) => r.toUpperCase());
    return normalizedItemRoles.some((allowedRole) =>
      normalizedUserRoles.includes(allowedRole)
    );
  });
}
