import { useEffect, useState } from "react";
import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router";
import DomainIcon from "@mui/icons-material/Domain";
import LogoutIcon from "@mui/icons-material/Logout";

export const meta = () => {
  return [
    { title: "Classroom Reservation" },
    { name: "description", content: "Welcome to Classroom Reservation System!" },
  ];
};

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
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
          Classroom Reservation System
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
          Manage your classroom reservations efficiently and securely
        </Typography>

        {isAuthenticated ? (
          <Stack direction="column" spacing={2}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<DomainIcon />}
                onClick={() => navigate("/rooms")}
              >
                Manage Environments
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
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
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
