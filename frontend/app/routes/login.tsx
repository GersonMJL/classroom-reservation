import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";

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
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Entrar
        </Typography>

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
            sx={{ py: 1.5, fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Entrar"}
          </Button>
        </Box>

        <Typography variant="body2">
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
      </Box>
    </Container>
  );
}
