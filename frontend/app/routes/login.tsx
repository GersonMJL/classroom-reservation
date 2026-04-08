import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError("E-mail é obrigatório");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Senha é obrigatória");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formUrlEncoded = new URLSearchParams();
      formUrlEncoded.append("username", formData.username);
      formUrlEncoded.append("password", formData.password);

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formUrlEncoded.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Falha no login");
        return;
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);

      setFormData({ username: "", password: "" });
      navigate("/");
    } catch (err) {
      setError("Ocorreu um erro durante o login. Tente novamente.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-shell">
      <Paper className="auth-card page-enter" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="column" spacing={2} sx={{ mb: 2.5 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
            <MeetingRoomIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Entrar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acesse sua conta para gerenciar reservas, recursos e finalidades.
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", gap: 2, display: "flex", flexDirection: "column" }}>
          <TextField
            fullWidth
            label="E-mail"
            name="username"
            type="email"
            value={formData.username}
            onChange={handleChange}
            placeholder="exemplo@email.com"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Sua senha"
            variant="outlined"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={loading ? undefined : <LoginIcon />}
            sx={{ py: 1.4, fontSize: "0.98rem" }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Entrar"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Não tem uma conta?{" "}
          <Link
            href="/register"
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Cadastre-se aqui
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
