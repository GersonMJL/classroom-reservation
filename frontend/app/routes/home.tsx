import { useEffect, useState } from "react";
import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LogoutIcon from "@mui/icons-material/Logout";
import GroupIcon from "@mui/icons-material/Group";
import { getTokenRoles } from "../services/api";

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
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsAdmin(getTokenRoles().includes("admin"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Sistema de Reserva de Salas
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
          Gerencie as reservas de salas com eficiência e segurança
        </Typography>

        {isAuthenticated ? (
          <Stack direction="column" spacing={2}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<MeetingRoomIcon />}
                onClick={() => navigate("/rooms")}
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
          </Stack>
        ) : (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/register")}
            >
              Cadastrar
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
