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
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Create/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurposeId, setEditingPurposeId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [dialogError, setDialogError] = useState("");

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<Purpose | null>(null);

  const handleAuthError = (message: string): boolean => {
    if (
      message.includes("Could not validate credentials") ||
      message.includes("Token expired") ||
      message.includes("Não foi possível validar as credenciais") ||
      message.includes("Token expirado")
    ) {
      clearAuthTokens();
      navigate("/login");
      return true;
    }
    return false;
  };

  const loadPurposes = async () => {
    setListLoading(true);
    setError("");
    try {
      const data = await purposeApi.getAllPurposes(0, 500, false);
      setPurposes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar finalidades";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setListLoading(false);
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
    if (!normalized) return purposes;
    return purposes.filter((p) => p.name.toLowerCase().includes(normalized));
  }, [purposes, searchValue]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingPurposeId(null);
    setNameInput("");
    setDialogError("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (purpose: Purpose) => {
    setIsEditMode(true);
    setEditingPurposeId(purpose.id);
    setNameInput(purpose.name);
    setDialogError("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingPurposeId(null);
    setNameInput("");
    setDialogError("");
  };

  const handleSave = async () => {
    const normalized = nameInput.trim();
    if (!normalized) {
      setDialogError("Nome da finalidade é obrigatório.");
      return;
    }

    setSaving(true);
    setDialogError("");
    try {
      if (isEditMode && editingPurposeId !== null) {
        const updated = await purposeApi.updatePurpose(editingPurposeId, { name: normalized });
        setPurposes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSuccessMessage(`Finalidade "${updated.name}" atualizada`);
      } else {
        const created = await purposeApi.createPurpose({ name: normalized });
        if (!purposes.some((item) => item.id === created.id)) {
          setPurposes((prev) => [...prev, created]);
        }
        setSuccessMessage(`Finalidade "${created.name}" criada`);
      }
      closeDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar finalidade";
      if (!handleAuthError(message)) setDialogError(message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (purpose: Purpose) => {
    setDeleteTarget(purpose);
  };

  const closeDeleteConfirm = () => {
    if (saving) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await purposeApi.deletePurpose(deleteTarget.id);
      setPurposes((prev) =>
        prev.map((item) =>
          item.id === deleteTarget.id ? { ...item, is_active: false } : item
        )
      );
      setSuccessMessage(`Finalidade "${deleteTarget.name}" excluída`);
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao excluir finalidade";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSaving(false);
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
              disabled={listLoading}
            >
              Nova Finalidade
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPurposes}
            disabled={listLoading}
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

      {listLoading && purposes.length === 0 ? (
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
                          disabled={saving || !purpose.is_active}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDeleteConfirm(purpose)}
                          disabled={saving || !purpose.is_active}
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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Editar Finalidade" : "Nova Finalidade"}</DialogTitle>
        <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 3 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {dialogError && (
              <Alert severity="error" onClose={() => setDialogError("")}>
                {dialogError}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Nome *"
              value={nameInput}
              onChange={(event) => {
                setNameInput(event.target.value);
                if (dialogError) setDialogError("");
              }}
              error={!!dialogError && !nameInput.trim()}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Aguarde..." : isEditMode ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir finalidade</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a finalidade{" "}
            <strong>"{deleteTarget?.name}"</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={saving}
          >
            {saving ? "Aguarde..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
