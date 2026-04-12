import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LogoutIcon from "@mui/icons-material/Logout";
import GroupIcon from "@mui/icons-material/Group";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DevicesIcon from "@mui/icons-material/Devices";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import {
  AUTH_LOGOUT_EVENT,
  clearAuthTokens,
  getTokenRoles,
  hasValidAccessToken,
} from "../services/api";

export const meta = () => {
  return [
    { title: "Reserva de Salas" },
    { name: "description", content: "Bem-vindo ao Sistema de Reserva de Salas!" },
  ];
};

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const authenticated = hasValidAccessToken();
      setIsAuthenticated(authenticated);
      setIsAdmin(authenticated && getTokenRoles().includes("admin"));
    };

    syncAuthState();

    const intervalId = window.setInterval(syncAuthState, 30000);
    window.addEventListener("focus", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    window.addEventListener(AUTH_LOGOUT_EVENT, syncAuthState as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener(AUTH_LOGOUT_EVENT, syncAuthState as EventListener);
    };
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "calc(100vh - 96px)",
          gap: 3,
        }}
      >
        <Chip
          label="Painel de Gestão"
          color="secondary"
          sx={{ width: "fit-content", fontWeight: 700 }}
        />

        <Typography
          variant="h2"
          component="h1"
          sx={{ fontSize: { xs: "2rem", md: "3.2rem" }, maxWidth: 780, lineHeight: 1.05 }}
        >
          Reserva de ambientes com clareza, controle e fluxo rápido
        </Typography>

        <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 720 }}>
          Organize espaços, recursos e permissões em uma interface única, pensada para operações do dia a dia sem atrito.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
          <Chip icon={<ApartmentIcon />} label="Ambientes" variant="outlined" />
          <Chip icon={<DevicesIcon />} label="Recursos" variant="outlined" />
          <Chip icon={<ChecklistRtlIcon />} label="Finalidades" variant="outlined" />
        </Stack>

        {isAuthenticated ? (
          <Paper sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Ações rápidas
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                startIcon={<MeetingRoomIcon />}
                onClick={() => navigate("/environments")}
              >
                Gerenciar Ambientes
              </Button>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<GroupIcon />}
                  onClick={() => navigate("/users")}
                >
                  Gerenciar Usuários
                </Button>
              )}
              <Button
                variant="outlined"
                size="large"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Sair
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="large"
              href="/login"
            >
              Entrar
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/register"
            >
              Cadastrar
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
