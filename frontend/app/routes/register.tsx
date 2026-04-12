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
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
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
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }
    if (!formData.email.trim()) {
      setError("E-mail é obrigatório");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Informe um endereço de e-mail válido");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Senha é obrigatória");
      return false;
    }
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
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
      const response = await fetch("http://localhost:8000/api/v1/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          is_active: true,
          roles: ["user"],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Falha no cadastro");
        return;
      }

      setFormData({ email: "", password: "", confirmPassword: "", name: "" });
      navigate("/login");
    } catch (err) {
      setError("Ocorreu um erro durante o cadastro. Tente novamente.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-shell">
      <Paper className="auth-card page-enter" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="column" spacing={2} sx={{ mb: 2.5 }}>
          <Avatar sx={{ bgcolor: "secondary.main", width: 44, height: 44 }}>
            <VerifiedUserIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Criar conta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cadastre-se para acessar o painel de gerenciamento de ambientes.
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", gap: 2, display: "flex", flexDirection: "column" }}>
          <TextField
            fullWidth
            label="Nome Completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="João da Silva"
            variant="outlined"
            required
          />

          <TextField
            fullWidth
            label="E-mail"
            name="email"
            type="email"
            value={formData.email}
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
            placeholder="Pelo menos 6 caracteres"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Confirmar Senha"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirme sua senha"
            variant="outlined"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={loading ? undefined : <PersonAddAlt1Icon />}
            sx={{ py: 1.4, fontSize: "0.98rem" }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Cadastrar"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Já tem uma conta?{" "}
          <Link
            href="/login"
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Entre aqui
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
