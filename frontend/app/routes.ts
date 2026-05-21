import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("environments", "routes/environments.tsx"),
  route("resources", "routes/resources.tsx"),
  route("purposes", "routes/purposes.tsx"),
  route("users", "routes/users.tsx"),
  route("organizational-units", "routes/organizational-units.tsx"),
  route("qualifications", "routes/qualifications.tsx"),
  route("reservas", "routes/reservations.tsx"),
  route("aprovacoes", "routes/approvals.tsx"),
  route("auditoria", "routes/audit.tsx"),
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
