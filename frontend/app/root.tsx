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
import { ThemeProvider, alpha, createTheme } from "@mui/material/styles";
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
    primary: {
      main: "#1f6f5f",
      dark: "#184f44",
      light: "#4a9a8a",
      contrastText: "#f8fbf9",
    },
    secondary: {
      main: "#b25e2e",
      dark: "#8b4721",
      light: "#d98b58",
      contrastText: "#fff9f5",
    },
    background: {
      default: "#f3f5ef",
      paper: "#ffffff",
    },
    text: {
      primary: "#17322d",
      secondary: "#4f665f",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Sora", "Space Grotesk", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Space Grotesk", "Sora", sans-serif', fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 10% 10%, rgba(95, 178, 154, 0.2), transparent 35%), radial-gradient(circle at 90% 0%, rgba(214, 146, 88, 0.15), transparent 30%), #f3f5ef",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(31, 111, 95, 0.15)",
          boxShadow: "0 8px 28px rgba(23, 50, 45, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.82)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(31, 111, 95, 0.12)",
          boxShadow: "0 10px 30px rgba(23, 50, 45, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1)",
          "&:active": {
            transform: "scale(0.97)",
          },
        },
        contained: {
          boxShadow: "0 10px 22px rgba(31, 111, 95, 0.22)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#eef4f1",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#2e4740",
          fontWeight: 700,
        },
      },
    },
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

  const menuItems = [
    { label: "Ambientes", path: "/environments" },
    { label: "Recursos", path: "/resources" },
    { label: "Finalidades", path: "/purposes" },
  ];

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box id="app-root">
        {!isHomeRoute && (
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar sx={{ gap: 1, minHeight: 74, px: { xs: 1, md: 2 } }}>
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
                color: "#17322d",
              }}
            >
              Reserva de Salas
            </Typography>

            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "contained" : "text"}
                  color={isActive ? "primary" : "inherit"}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: isActive ? "primary.contrastText" : "text.primary",
                    backgroundColor: isActive
                      ? "primary.main"
                      : alpha("#1f6f5f", 0.08),
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.dark"
                        : alpha("#1f6f5f", 0.14),
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
            {isAdmin && (
              <Button
                variant={location.pathname.startsWith("/users") ? "contained" : "text"}
                color={location.pathname.startsWith("/users") ? "secondary" : "inherit"}
                onClick={() => navigate("/users")}
                sx={{
                  color: location.pathname.startsWith("/users")
                    ? "secondary.contrastText"
                    : "text.primary",
                  backgroundColor: location.pathname.startsWith("/users")
                    ? "secondary.main"
                    : alpha("#b25e2e", 0.1),
                  "&:hover": {
                    backgroundColor: location.pathname.startsWith("/users")
                      ? "secondary.dark"
                      : alpha("#b25e2e", 0.16),
                  },
                }}
              >
                Usuários
              </Button>
            )}
            {isAuthenticated ? (
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleLogout}
                sx={{ borderColor: "rgba(23, 50, 45, 0.28)" }}
              >
                Sair
              </Button>
            ) : (
              <>
                <Button color="inherit" href="/login">
                  Entrar
                </Button>
                <Button variant="contained" href="/register">
                  Cadastrar
                </Button>
              </>
            )}
            </Toolbar>
          </AppBar>
        )}

        <Box component="main" className="page-enter" sx={{ pb: 5 }}>
          {!isHomeRoute && <Toolbar sx={{ minHeight: 80 }} />}
          <Outlet />
        </Box>
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
