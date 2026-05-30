import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
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
  CircularProgress,
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
  organizationalUnitApi,
} from "../services/api";
import type { OrganizationalUnit, OrganizationalUnitCreate } from "../services/api";

const initialForm: OrganizationalUnitCreate = { name: "", type: "" };

export default function OrganizationalUnitsManagement() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<OrganizationalUnitCreate>(initialForm);

  const loadUnits = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await organizationalUnitApi.getAll(0, 500);
      setUnits(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar unidades organizacionais";
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
    loadUnits();
  }, [navigate]);

  const filteredUnits = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return units;
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(normalized) ||
        u.type.toLowerCase().includes(normalized)
    );
  }, [units, searchValue]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (unit: OrganizationalUnit) => {
    setIsEditMode(true);
    setEditingId(unit.id);
    setFormData({ name: unit.name, type: unit.type });
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
    if (!formData.type.trim()) {
      setError("Tipo é obrigatório");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEditMode && editingId !== null) {
        const updated = await organizationalUnitApi.update(editingId, formData);
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setSuccessMessage(`Unidade "${updated.name}" atualizada`);
      } else {
        const created = await organizationalUnitApi.create(formData);
        setUnits((prev) => [...prev, created]);
        setSuccessMessage(`Unidade "${created.name}" criada`);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar unidade organizacional");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (unit: OrganizationalUnit) => {
    if (!window.confirm(`Excluir a unidade "${unit.name}"?`)) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await organizationalUnitApi.delete(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      setSuccessMessage(`Unidade "${unit.name}" excluída`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir unidade organizacional");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Unidades Organizacionais
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as unidades organizacionais do sistema.
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
              Nova Unidade
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUnits}
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
          label="Pesquisar unidades"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Pesquise por nome ou tipo"
        />
      </Paper>

      {loading && units.length === 0 ? (
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
                <TableCell>Tipo</TableCell>
                {isAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{unit.name}</TableCell>
                  <TableCell>{unit.type}</TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(unit)}
                          disabled={loading}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(unit)}
                          disabled={loading}
                        >
                          Excluir
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3}>
                    <Alert severity="info">Nenhuma unidade encontrada.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Editar Unidade" : "Nova Unidade Organizacional"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&.MuiDialogContent-root": { pt: 3 } }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex.: Departamento de Ciência da Computação"
          />
          <TextField
            fullWidth
            label="Tipo"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="Ex.: DEPARTMENT, FACULTY, INSTITUTE"
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
