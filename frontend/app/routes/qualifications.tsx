import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
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
  qualificationApi,
} from "../services/api";
import type { Qualification, QualificationCreate } from "../services/api";

const initialForm: QualificationCreate = { name: "", description: "" };

export default function QualificationsManagement() {
  const navigate = useNavigate();
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QualificationCreate>(initialForm);

  const loadQualifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await qualificationApi.getAll(0, 500);
      setQualifications(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar qualificações";
      if (
        message.includes("Could not validate credentials")
        || message.includes("Token expired")
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
    loadQualifications();
  }, [navigate]);

  const filteredQualifications = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return qualifications;
    return qualifications.filter(
      (q) =>
        q.name.toLowerCase().includes(normalized) ||
        q.description.toLowerCase().includes(normalized)
    );
  }, [qualifications, searchValue]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (qualification: Qualification) => {
    setIsEditMode(true);
    setEditingId(qualification.id);
    setFormData({ name: qualification.name, description: qualification.description });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!formData.description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEditMode && editingId !== null) {
        const updated = await qualificationApi.update(editingId, formData);
        setQualifications((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        setSuccessMessage(`Qualificação "${updated.name}" atualizada`);
      } else {
        const created = await qualificationApi.create(formData);
        setQualifications((prev) => [...prev, created]);
        setSuccessMessage(`Qualificação "${created.name}" criada`);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar qualificação");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (qualification: Qualification) => {
    if (!window.confirm(`Excluir a qualificação "${qualification.name}"?`)) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await qualificationApi.delete(qualification.id);
      setQualifications((prev) => prev.filter((q) => q.id !== qualification.id));
      setSuccessMessage(`Qualificação "${qualification.name}" excluída`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir qualificação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Qualificações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as qualificações exigidas para reservar ambientes especializados.
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
              Nova Qualificação
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadQualifications}
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
          label="Pesquisar qualificações"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Pesquise por nome ou descrição"
        />
      </Paper>

      {loading && qualifications.length === 0 ? (
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
                <TableCell>Descrição</TableCell>
                {isAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQualifications.map((qualification) => (
                <TableRow key={qualification.id}>
                  <TableCell>{qualification.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{qualification.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary", maxWidth: 400 }}>
                    {qualification.description}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(qualification)}
                          disabled={loading}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(qualification)}
                          disabled={loading}
                        >
                          Excluir
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredQualifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3}>
                    <Alert severity="info">Nenhuma qualificação encontrada.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Editar Qualificação" : "Nova Qualificação"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&.MuiDialogContent-root": { pt: 3 } }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex.: NR-10 Segurança Elétrica"
          />
          <TextField
            fullWidth
            label="Descrição"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o que esta qualificação exige ou certifica"
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
