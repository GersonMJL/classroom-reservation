import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  clearAuthTokens,
  getTokenRoles,
  hasValidAccessToken,
  purposeApi,
} from "../services/api";
import type { Purpose } from "../services/api";

export default function PurposesManagement() {
  const navigate = useNavigate();
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurposeId, setEditingPurposeId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");

  const loadPurposes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await purposeApi.getAllPurposes(0, 500, false);
      setPurposes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar finalidades";
      if (
        message.includes("Could not validate credentials")
        || message.includes("Token expired")
        || message.includes("Não foi possível validar as credenciais")
        || message.includes("Token expirado")
      ) {
        clearAuthTokens();
        navigate("/login");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidAccessToken()) {
      navigate("/login");
      return;
    }

    setIsAdmin(getTokenRoles().includes("admin"));
    loadPurposes();
  }, [navigate]);

  const filteredPurposes = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return purposes;
    }

    return purposes.filter((purpose) => purpose.name.toLowerCase().includes(normalized));
  }, [purposes, searchValue]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingPurposeId(null);
    setNameInput("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (purpose: Purpose) => {
    setIsEditMode(true);
    setEditingPurposeId(purpose.id);
    setNameInput(purpose.name);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingPurposeId(null);
    setNameInput("");
  };

  const handleSave = async () => {
    const normalized = nameInput.trim();
    if (!normalized) {
      setError("Nome da finalidade é obrigatório");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEditMode && editingPurposeId !== null) {
        const updated = await purposeApi.updatePurpose(editingPurposeId, { name: normalized });
        setPurposes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccessMessage(`Finalidade ${updated.name} atualizada`);
      } else {
        const created = await purposeApi.createPurpose({ name: normalized });
        if (!purposes.some((item) => item.id === created.id)) {
          setPurposes((prev) => [...prev, created]);
        }
        setSuccessMessage(`Finalidade ${created.name} criada`);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar finalidade");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (purpose: Purpose) => {
    const confirmed = window.confirm(`Excluir a finalidade ${purpose.name}?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await purposeApi.deletePurpose(purpose.id);
      setPurposes((prev) => prev.map((item) => (
        item.id === purpose.id ? { ...item, is_active: false } : item
      )));
      setSuccessMessage(`Finalidade ${purpose.name} excluída`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir finalidade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Gestão de Finalidades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cadastre, atualize e desative finalidades permitidas para os ambientes.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              disabled={loading}
            >
              Nova Finalidade
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPurposes}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Pesquisar finalidades"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Pesquise por nome"
        />
      </Paper>

      {loading && purposes.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurposes.map((purpose) => (
                <TableRow key={purpose.id}>
                  <TableCell>{purpose.id}</TableCell>
                  <TableCell>{purpose.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={purpose.is_active ? "Ativa" : "Inativa"}
                      color={purpose.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(purpose)}
                          disabled={loading || !purpose.is_active}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(purpose)}
                          disabled={loading || !purpose.is_active}
                        >
                          Excluir
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredPurposes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3}>
                    <Alert severity="info">Nenhuma finalidade encontrada para este filtro.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Editar Finalidade" : "Nova Finalidade"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {isEditMode ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
