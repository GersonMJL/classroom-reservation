import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("rooms", "routes/rooms.tsx"),
  route("resources", "routes/resources.tsx"),
  route("purposes", "routes/purposes.tsx"),
  route("users", "routes/users.tsx"),
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
