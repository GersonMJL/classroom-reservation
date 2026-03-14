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
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import type { Route } from "./+types/root";
import { getTokenRoles } from "./services/api";
import "./app.css";

const isBrowser = typeof window !== "undefined";

const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
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
  const isHomeRoute = location.pathname === "/";
  const isAuthenticated = isBrowser
    ? Boolean(localStorage.getItem("accessToken"))
    : false;
  const isAdmin = isBrowser ? getTokenRoles().includes("admin") : false;

  const handleLogout = () => {
    if (!isBrowser) {
      return;
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {!isHomeRoute && (
        <AppBar position="fixed" color="default" elevation={1}>
          <Toolbar sx={{ gap: 1 }}>
            <Typography
              variant="h6"
              component="button"
              onClick={() => navigate("/")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 700,
                marginRight: "auto",
              }}
            >
              Reserva de Salas
            </Typography>

            <Button color="inherit" onClick={() => navigate("/rooms")}>
              Ambientes
            </Button>
            <Button color="inherit" onClick={() => navigate("/resources")}>
              Recursos
            </Button>
            <Button color="inherit" onClick={() => navigate("/purposes")}>
              Finalidades
            </Button>
            {isAdmin && (
              <Button color="inherit" onClick={() => navigate("/users")}>
                Usuários
              </Button>
            )}
            {isAuthenticated ? (
              <Button variant="outlined" color="inherit" onClick={handleLogout}>
                Sair
              </Button>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button variant="contained" onClick={() => navigate("/register")}>
                  Cadastrar
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
      )}

      <Box component="main">
        {!isHomeRoute && <Toolbar />}
        <Outlet />
      </Box>
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
