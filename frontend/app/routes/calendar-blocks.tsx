import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs, { type Dayjs } from "dayjs";

import {
  calendarBlockApi,
  clearAuthTokens,
  environmentApi,
  hasValidAccessToken,
} from "../services/api";
import type {
  CalendarBlock,
  CalendarBlockCreate,
  CalendarBlockType,
  Room,
} from "../services/api";

const TYPE_LABEL: Record<CalendarBlockType, string> = {
  ADMIN_BLOCK: "Bloqueio administrativo",
  MAINTENANCE: "Manutenção",
  RECURRING_EVENT: "Evento recorrente",
  BUFFER: "Buffer",
  HOLIDAY: "Feriado",
  CLOSURE: "Fechamento",
};

const PRIORITY_COLOR: Record<
  string,
  "default" | "primary" | "warning" | "error"
> = {
  CRITICAL: "error",
  HIGH: "warning",
  NORMAL: "primary",
  LOW: "default",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  NORMAL: "Normal",
  LOW: "Baixa",
};

const EDITABLE_TYPES: CalendarBlockType[] = [
  "ADMIN_BLOCK",
  "MAINTENANCE",
  "RECURRING_EVENT",
  "HOLIDAY",
  "CLOSURE",
];

interface FormState {
  environment_id: number | "";
  type: CalendarBlockType | "";
  priority: string;
  start_time: Dayjs | null;
  end_time: Dayjs | null;
}

const emptyForm = (): FormState => ({
  environment_id: "",
  type: "",
  priority: "NORMAL",
  start_time: null,
  end_time: null,
});

export default function CalendarBlocksPage() {
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [environments, setEnvironments] = useState<Room[]>([]);
  const [filterEnvId, setFilterEnvId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create/edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CalendarBlock | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<CalendarBlock | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Release dialog
  const [releaseTarget, setReleaseTarget] = useState<CalendarBlock | null>(null);
  const [releasing, setReleasing] = useState(false);

  const handleAuthError = (message: string): boolean => {
    if (
      message.includes("Sua sessão expirou") ||
      message.includes("Could not validate credentials") ||
      message.includes("Token expired")
    ) {
      clearAuthTokens();
      navigate("/login");
      return true;
    }
    return false;
  };

  const loadBlocks = async (envId?: number | "") => {
    setLoading(true);
    setError("");
    try {
      const id = envId !== undefined ? envId : filterEnvId;
      const data = await calendarBlockApi.list(
        id !== "" ? (id as number) : undefined
      );
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setBlocks(sorted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao listar bloqueios";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidAccessToken()) {
      navigate("/login");
      return;
    }
    const bootstrap = async () => {
      try {
        const [envs, data] = await Promise.all([
          environmentApi.getAllRooms(0, 500),
          calendarBlockApi.list(),
        ]);
        setEnvironments(envs);
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        setBlocks(sorted);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados";
        if (!handleAuthError(message)) setError(message);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [navigate]);

  const getEnvironmentName = (id: number): string =>
    environments.find((e) => e.id === id)?.name ?? `Ambiente #${id}`;

  const formatDateTime = (iso: string) =>
    dayjs(iso).format("DD/MM/YYYY HH:mm");

  const formatEnd = (startIso: string, endIso: string) => {
    const start = dayjs(startIso);
    const end = dayjs(endIso);
    if (start.isSame(end, "day")) {
      return end.format("HH:mm");
    }
    return end.format("DD/MM/YYYY HH:mm");
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (block: CalendarBlock) => {
    setEditTarget(block);
    setForm({
      environment_id: block.environment_id,
      type: block.type,
      priority: block.priority,
      start_time: dayjs(block.start_time),
      end_time: dayjs(block.end_time),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditTarget(null);
    setForm(emptyForm());
  };

  const handleFormSave = async () => {
    if (
      form.environment_id === "" ||
      form.type === "" ||
      !form.start_time ||
      !form.end_time
    ) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload: CalendarBlockCreate = {
        environment_id: form.environment_id as number,
        type: form.type as CalendarBlockType,
        priority: form.priority || undefined,
        start_time: form.start_time.toISOString(),
        end_time: form.end_time.toISOString(),
      };
      if (editTarget) {
        await calendarBlockApi.update(editTarget.id, payload);
        setSuccessMessage("Bloqueio atualizado com sucesso.");
      } else {
        await calendarBlockApi.create(payload);
        setSuccessMessage("Bloqueio criado com sucesso.");
      }
      setFormOpen(false);
      setEditTarget(null);
      setForm(emptyForm());
      await loadBlocks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao salvar bloqueio";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (block: CalendarBlock) => setDeleteTarget(block);
  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await calendarBlockApi.remove(deleteTarget.id);
      setSuccessMessage("Bloqueio removido.");
      setBlocks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao remover bloqueio";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const openRelease = (block: CalendarBlock) => setReleaseTarget(block);
  const closeRelease = () => {
    if (releasing) return;
    setReleaseTarget(null);
  };

  const handleRelease = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    setError("");
    try {
      const updated = await calendarBlockApi.releaseEarly(releaseTarget.id);
      setSuccessMessage("Bloqueio liberado antecipadamente.");
      setBlocks((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      setReleaseTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao liberar bloqueio";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setReleasing(false);
    }
  };

  const handleFilterChange = (envId: number | "") => {
    setFilterEnvId(envId);
    loadBlocks(envId);
  };

  const isFormValid =
    form.environment_id !== "" &&
    form.type !== "" &&
    form.start_time !== null &&
    form.end_time !== null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
            Bloqueios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Bloqueios administrativos de calendário
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadBlocks()}
            disabled={loading}
            sx={{ borderColor: "rgba(31, 111, 95, 0.3)", color: "text.primary" }}
          >
            Atualizar
          </Button>
          <Button variant="contained" color="primary" onClick={openCreate}>
            Novo bloqueio
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Ambiente</InputLabel>
          <Select
            label="Ambiente"
            value={filterEnvId}
            onChange={(e) => handleFilterChange(e.target.value as number | "")}
          >
            <MenuItem value="">Todos</MenuItem>
            {environments.map((env) => (
              <MenuItem key={env.id} value={env.id}>
                {env.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : blocks.length === 0 ? (
        <Alert severity="info">Nenhum bloqueio encontrado.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ambiente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Término</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blocks.map((block, index) => (
                  <TableRow
                    key={block.id}
                    sx={{
                      animation: `fadeUp 240ms cubic-bezier(0.23, 1, 0.32, 1) both`,
                      animationDelay: `${Math.min(index, 6) * 40}ms`,
                      "@keyframes fadeUp": {
                        from: { opacity: 0, transform: "translateY(6px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                      "@media (prefers-reduced-motion: reduce)": {
                        animation: "none",
                      },
                    }}
                  >
                    <TableCell>{getEnvironmentName(block.environment_id)}</TableCell>
                    <TableCell>
                      <Chip
                        label={TYPE_LABEL[block.type] ?? block.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PRIORITY_LABEL[block.priority] ?? block.priority}
                        color={PRIORITY_COLOR[block.priority] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(block.start_time)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatEnd(block.start_time, block.end_time)}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {block.type === "BUFFER" ? (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => openRelease(block)}
                          >
                            Liberar agora
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openEdit(block)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => openDelete(block)}
                            >
                              Excluir
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? "Editar bloqueio" : "Novo bloqueio"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Ambiente</InputLabel>
              <Select
                label="Ambiente"
                value={form.environment_id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    environment_id: e.target.value as number,
                  }))
                }
              >
                {environments.map((env) => (
                  <MenuItem key={env.id} value={env.id}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as CalendarBlockType,
                  }))
                }
              >
                {EDITABLE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                label="Prioridade"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as string }))
                }
              >
                <MenuItem value="CRITICAL">Crítica</MenuItem>
                <MenuItem value="HIGH">Alta</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="LOW">Baixa</MenuItem>
              </Select>
            </FormControl>

            <DateTimePicker
              label="Início *"
              value={form.start_time}
              onChange={(val) => setForm((f) => ({ ...f, start_time: val }))}
              ampm={false}
              format="DD/MM/YYYY HH:mm"
            />

            <DateTimePicker
              label="Término *"
              value={form.end_time}
              onChange={(val) => setForm((f) => ({ ...f, end_time: val }))}
              ampm={false}
              format="DD/MM/YYYY HH:mm"
              minDateTime={form.start_time ?? undefined}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeForm} disabled={submitting} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFormSave}
            disabled={submitting || !isFormValid}
          >
            {submitting ? "Aguarde..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={closeDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Excluir bloqueio</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este bloqueio? Esta ação não pode ser desfeita.
          </Typography>
          {deleteTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {TYPE_LABEL[deleteTarget.type]} —{" "}
              {getEnvironmentName(deleteTarget.environment_id)} —{" "}
              {formatDateTime(deleteTarget.start_time)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDelete} disabled={deleting} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Release Confirmation Dialog */}
      <Dialog
        open={Boolean(releaseTarget)}
        onClose={closeRelease}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Liberar bloqueio antecipadamente</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja liberar este bloqueio de buffer antes do término previsto?
          </Typography>
          {releaseTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getEnvironmentName(releaseTarget.environment_id)} —{" "}
              {formatDateTime(releaseTarget.start_time)} até{" "}
              {formatEnd(releaseTarget.start_time, releaseTarget.end_time)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeRelease} disabled={releasing} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRelease}
            disabled={releasing}
          >
            {releasing ? "Liberando..." : "Liberar agora"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
