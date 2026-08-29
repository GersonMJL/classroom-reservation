import { useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../services/api";
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
import { DemoAccountsBanner, type DemoAccount } from "../ui/DemoAccountsBanner";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectAccount = (account: DemoAccount) => {
    setFormData({
      username: account.email,
      password: account.pass,
    });
    setError("");
  };

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

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    <Box className="auth-shell" sx={{ py: 4, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 480, mx: "auto", px: 2 }}>
        <Paper className="auth-card page-enter" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
          <Stack direction="column" spacing={2} sx={{ mb: 2.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <MeetingRoomIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Entrar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Acesse sua conta para consultar horários e solicitar reservas.
              </Typography>
            </Box>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
              sx={{ py: 1.4, fontSize: "0.98rem", borderRadius: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Entrar"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: "center" }}>
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

        {/* 1-Click Demo Accounts Selector */}
        <DemoAccountsBanner
          onSelectAccount={handleSelectAccount}
          selectedEmail={formData.username}
          compact
        />
      </Stack>
    </Box>
  );
}
