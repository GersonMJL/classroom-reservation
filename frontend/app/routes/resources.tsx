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
import { getTokenRoles, resourceApi } from "../services/api";
import type { Resource, ResourceCreate } from "../services/api";

const emptyForm: ResourceCreate = {
  resource_code: "",
  name: "",
  resource_type: "",
  availability_notes: "",
};

export default function ResourcesManagement() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResourceCreate>(emptyForm);

  const loadResources = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await resourceApi.getAllResources(0, 500, false);
      setResources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar recursos";
      if (
        message.includes("Could not validate credentials")
        || message.includes("Token expired")
        || message.includes("Não foi possível validar as credenciais")
        || message.includes("Token expirado")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsAdmin(getTokenRoles().includes("admin"));
    loadResources();
  }, [navigate]);

  const filteredResources = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return resources;
    }

    return resources.filter((resource) =>
      resource.resource_code.toLowerCase().includes(normalized)
      || resource.name.toLowerCase().includes(normalized)
      || resource.resource_type.toLowerCase().includes(normalized)
    );
  }, [resources, searchValue]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingResourceId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (resource: Resource) => {
    setIsEditMode(true);
    setEditingResourceId(resource.id);
    setFormData({
      resource_code: resource.resource_code,
      name: resource.name,
      resource_type: resource.resource_type,
      availability_notes: resource.availability_notes || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingResourceId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    const payload: ResourceCreate = {
      resource_code: formData.resource_code.trim(),
      name: formData.name.trim(),
      resource_type: formData.resource_type.trim(),
      availability_notes: formData.availability_notes?.trim() || null,
    };

    if (!payload.resource_code && !isEditMode) {
      setError("Código do recurso é obrigatório");
      return;
    }
    if (!payload.name) {
      setError("Nome do recurso é obrigatório");
      return;
    }
    if (!payload.resource_type) {
      setError("Tipo do recurso é obrigatório");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEditMode && editingResourceId !== null) {
        const updated = await resourceApi.updateResource(editingResourceId, {
          name: payload.name,
          resource_type: payload.resource_type,
          availability_notes: payload.availability_notes,
        });
        setResources((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccessMessage(`Recurso ${updated.resource_code} atualizado`);
      } else {
        const created = await resourceApi.createResource(payload);
        setResources((prev) => [...prev, created]);
        setSuccessMessage(`Recurso ${created.resource_code} criado`);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar recurso");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    const confirmed = window.confirm(
      `Excluir o recurso ${resource.resource_code} - ${resource.name}?`
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await resourceApi.deleteResource(resource.id);
      setResources((prev) => prev.map((item) => (
        item.id === resource.id ? { ...item, is_active: false } : item
      )));
      setSuccessMessage(`Recurso ${resource.resource_code} excluído`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir recurso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Gestão de Recursos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cadastre, atualize e desative recursos disponíveis para reservas.
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
              Novo Recurso
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadResources}
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
          label="Pesquisar recursos"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Pesquise por código, nome ou tipo"
        />
      </Paper>

      {loading && resources.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Observações</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>{resource.id}</TableCell>
                  <TableCell>{resource.resource_code}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.resource_type}</TableCell>
                  <TableCell>{resource.availability_notes || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={resource.is_active ? "Ativo" : "Inativo"}
                      color={resource.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(resource)}
                          disabled={loading || !resource.is_active}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(resource)}
                          disabled={loading || !resource.is_active}
                        >
                          Excluir
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredResources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6}>
                    <Alert severity="info">Nenhum recurso encontrado para este filtro.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Editar Recurso" : "Novo Recurso"}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Código"
            value={formData.resource_code}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, resource_code: event.target.value }))
            }
            fullWidth
            disabled={isEditMode}
          />
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Tipo"
            value={formData.resource_type}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, resource_type: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Observações de disponibilidade"
            value={formData.availability_notes || ""}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, availability_notes: event.target.value }))
            }
            fullWidth
            multiline
            minRows={2}
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
