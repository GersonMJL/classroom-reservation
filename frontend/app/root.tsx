import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "./ui/theme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { AppShell } from "./ui/AppShell";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

import type { Route } from "./+types/root";
import {
  AUTH_LOGOUT_EVENT,
  clearAuthTokens,
  getTokenRoles,
  hasValidAccessToken,
} from "./services/api";
import "./app.css";

const isBrowser = typeof window !== "undefined";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@300..800&family=Space+Grotesk:wght@300..700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setAuthRefreshKey] = useState(0);
  const isHomeRoute = location.pathname === "/";
  const isAuthenticated = isBrowser ? hasValidAccessToken() : false;

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const refreshAuthState = () => {
      setAuthRefreshKey((value) => value + 1);
    };

    const intervalId = window.setInterval(refreshAuthState, 30000);
    window.addEventListener("focus", refreshAuthState);
    window.addEventListener("storage", refreshAuthState);
    window.addEventListener(AUTH_LOGOUT_EVENT, refreshAuthState as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAuthState);
      window.removeEventListener("storage", refreshAuthState);
      window.removeEventListener(AUTH_LOGOUT_EVENT, refreshAuthState as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const isPublicRoute =
      location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register";

    if (!isAuthenticated && !isPublicRoute) {
      navigate("/login");
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleLogout = () => {
    if (!isBrowser) {
      return;
    }
    clearAuthTokens();
    navigate("/");
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <CssBaseline />
      <Box id="app-root">
        {!isHomeRoute && (
          <AppShell
            isAuthenticated={isAuthenticated}
            roles={isBrowser ? getTokenRoles() : []}
            onLogout={handleLogout}
          />
        )}

        <Box component="main" className="page-enter" sx={{ pb: 5 }}>
          {!isHomeRoute && <Toolbar sx={{ minHeight: 80 }} />}
          <Outlet />
        </Box>
      </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Ops!";
  let details = "Ocorreu um erro inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Erro";
    details =
      error.status === 404
        ? "A página solicitada não foi encontrada."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
