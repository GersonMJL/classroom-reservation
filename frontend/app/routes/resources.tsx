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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  environmentApi,
  getTokenRoles,
  hasValidAccessToken,
  resourceApi,
  resourceTransferApi,
} from "../services/api";
import type { Environment, Resource, ResourceAttachment, ResourceCreate } from "../services/api";

const emptyForm: ResourceCreate = {
  name: "",
  type: "",
  category: "GENERAL",
  attachment_type: "MOBILE",
};

export default function ResourcesManagement() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResourceCreate>(emptyForm);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferResource, setTransferResource] = useState<Resource | null>(null);
  const [transferEnvironmentId, setTransferEnvironmentId] = useState<number | "">("");

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
        || message.includes("Sua sessão expirou")
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
    loadResources();
    environmentApi
      .getAllRooms(0, 500)
      .then(setEnvironments)
      .catch(() => setEnvironments([]));
  }, [navigate]);

  const filteredResources = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return resources;
    }

    return resources.filter((resource) =>
      resource.name.toLowerCase().includes(normalized)
      || resource.type.toLowerCase().includes(normalized)
      || resource.category.toLowerCase().includes(normalized)
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
      name: resource.name,
      type: resource.type,
      category: resource.category,
      attachment_type: resource.attachment_type,
      environment_id: resource.environment_id,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingResourceId(null);
    setFormData(emptyForm);
  };

  const openTransferDialog = (resource: Resource) => {
    setTransferResource(resource);
    setTransferEnvironmentId("");
    setIsTransferDialogOpen(true);
  };

  const closeTransferDialog = () => {
    setIsTransferDialogOpen(false);
    setTransferResource(null);
    setTransferEnvironmentId("");
  };

  const handleTransfer = async () => {
    if (!transferResource || !transferEnvironmentId) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await resourceTransferApi.transfer(transferResource.id, transferEnvironmentId as number);
      setSuccessMessage(`Recurso "${transferResource.name}" transferido com sucesso`);
      closeTransferDialog();
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao transferir recurso");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const payload: ResourceCreate = {
      name: formData.name.trim(),
      type: formData.type.trim(),
      category: formData.category.trim() || "GENERAL",
      attachment_type: formData.attachment_type,
      environment_id: formData.environment_id ?? null,
    };

    if (!payload.name) {
      setError("Nome do recurso é obrigatório");
      return;
    }
    if (!payload.type) {
      setError("Tipo do recurso é obrigatório");
      return;
    }
    if (payload.attachment_type === "FIXED" && !payload.environment_id) {
      setError("Recurso fixo exige um ambiente de instalação");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEditMode && editingResourceId !== null) {
        const updated = await resourceApi.updateResource(editingResourceId, payload);
        setResources((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccessMessage(`Recurso "${updated.name}" atualizado`);
      } else {
        const created = await resourceApi.createResource(payload);
        setResources((prev) => [...prev, created]);
        setSuccessMessage(`Recurso "${created.name}" criado`);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar recurso");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    const confirmed = window.confirm(`Excluir o recurso "${resource.name}"?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await resourceApi.deleteResource(resource.id);
      setResources((prev) =>
        prev.map((item) =>
          item.id === resource.id ? { ...item, active: false } : item
        )
      );
      setSuccessMessage(`Recurso "${resource.name}" excluído`);
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
          placeholder="Pesquise por nome, tipo ou categoria"
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
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Vínculo</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>{resource.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{resource.name}</TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>{resource.category}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={resource.attachment_type === "FIXED" ? "Fixo" : "Móvel"}
                      color={resource.attachment_type === "FIXED" ? "info" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={resource.active ? "Ativo" : "Inativo"}
                      color={resource.active ? "success" : "default"}
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(resource)}
                          disabled={loading || !resource.active}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(resource)}
                          disabled={loading || !resource.active}
                        >
                          Excluir
                        </Button>
                        {resource.attachment_type === "MOBILE" && (
                          <Button
                            size="small"
                            onClick={() => openTransferDialog(resource)}
                            disabled={loading || !resource.active}
                          >
                            Transferir
                          </Button>
                        )}
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
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&.MuiDialogContent-root": { pt: 3 } }}>
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
            autoFocus
          />
          <TextField
            label="Tipo"
            value={formData.type}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, type: event.target.value }))
            }
            placeholder="Ex.: EQUIPMENT, FURNITURE, KEY"
            fullWidth
          />
          <TextField
            label="Categoria"
            value={formData.category}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, category: event.target.value }))
            }
            placeholder="Ex.: IT, AUDIOVISUAL, LABORATORY, GENERAL, FURNITURE"
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="attachment-label">Vínculo</InputLabel>
            <Select
              labelId="attachment-label"
              label="Vínculo"
              value={formData.attachment_type}
              onChange={(event) => {
                const value = event.target.value as ResourceAttachment;
                setFormData((prev) => ({
                  ...prev,
                  attachment_type: value,
                  environment_id: value === "MOBILE" ? null : prev.environment_id,
                }));
              }}
            >
              <MenuItem value="MOBILE">Móvel</MenuItem>
              <MenuItem value="FIXED">Fixo</MenuItem>
            </Select>
          </FormControl>
          {formData.attachment_type === "FIXED" && (
            <FormControl fullWidth>
              <InputLabel id="env-label">Ambiente de instalação</InputLabel>
              <Select
                labelId="env-label"
                label="Ambiente de instalação"
                value={formData.environment_id ?? ""}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    environment_id: Number(event.target.value) || null,
                  }))
                }
              >
                {environments.map((env) => (
                  <MenuItem key={env.id} value={env.id}>
                    {env.code ? `${env.code} — ${env.name}` : env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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
