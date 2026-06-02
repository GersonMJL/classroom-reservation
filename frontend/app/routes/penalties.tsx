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
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";

import {
  appealApi,
  clearAuthTokens,
  hasValidAccessToken,
  penaltyApi,
  userApi,
} from "../services/api";
import type {
  Appeal,
  Penalty,
  PenaltyManualCreate,
  PenaltyStatus,
  PenaltyType,
  User,
} from "../services/api";

const TYPE_LABEL: Record<PenaltyType, string> = {
  NO_SHOW: "No-show",
  LATE_CANCELLATION: "Cancelamento tardio",
  DAMAGE: "Dano",
  MISUSE: "Uso indevido",
  OVERTIME: "Tempo excedido",
  SAFETY_VIOLATION: "Violação de segurança",
};

const STATUS_LABEL: Record<PenaltyStatus, string> = {
  PENDING: "Pendente",
  APPLIED: "Aplicada",
  WAIVED: "Anulada",
  UNDER_APPEAL: "Em recurso",
  RESOLVED: "Resolvida",
};

const STATUS_COLOR: Record<
  PenaltyStatus,
  "default" | "primary" | "warning" | "error" | "success"
> = {
  PENDING: "default",
  APPLIED: "warning",
  WAIVED: "success",
  UNDER_APPEAL: "primary",
  RESOLVED: "default",
};

const PENALTY_TYPES: PenaltyType[] = [
  "NO_SHOW",
  "LATE_CANCELLATION",
  "DAMAGE",
  "MISUSE",
  "OVERTIME",
  "SAFETY_VIOLATION",
];

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  return dayjs(value).format("DD/MM/YYYY");
};

export default function PenaltiesPage() {
  const navigate = useNavigate();

  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [pendingAppeals, setPendingAppeals] = useState<Appeal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Appeal dialog state
  const [appealTarget, setAppealTarget] = useState<Penalty | null>(null);
  const [justification, setJustification] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Create manual penalty dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<PenaltyManualCreate>>({});
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const isStaff =
    currentUser?.roles.includes("admin") ||
    currentUser?.roles.includes("manager");

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

  const loadPenalties = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await penaltyApi.list({ limit: 200 });
      setPenalties(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao listar penalidades";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    if (!isStaff) return;
    try {
      const data = await appealApi.listPending();
      setPendingAppeals(data);
    } catch {
      // silent — not critical
    }
  };

  const handleResolve = async (appealId: number, approve: boolean) => {
    const notes = window.prompt("Notas da decisão:") ?? "";
    try {
      await appealApi.resolve(appealId, approve, notes);
      setSuccessMessage(approve ? "Recurso aprovado." : "Recurso rejeitado.");
      await Promise.all([loadPenalties(), loadAppeals()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao resolver recurso";
      if (!handleAuthError(message)) setError(message);
    }
  };

  useEffect(() => {
    if (!hasValidAccessToken()) {
      navigate("/login");
      return;
    }
    const bootstrap = async () => {
      try {
        const [allUsers, me] = await Promise.all([
          userApi.getAllUsers(0, 500),
          userApi.getCurrentUser(),
        ]);
        setUsers(allUsers);
        setCurrentUser(me);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados auxiliares";
        if (!handleAuthError(message)) setError(message);
      }
    };
    bootstrap();
    loadPenalties();
    loadAppeals();
  }, [navigate]);

  const getUserName = (id: number): string =>
    users.find((u) => u.id === id)?.name ?? `Usuário #${id}`;

  // Appeal handlers
  const openAppeal = (penalty: Penalty) => {
    setAppealTarget(penalty);
    setJustification("");
  };

  const closeAppeal = () => {
    if (submittingAppeal) return;
    setAppealTarget(null);
    setJustification("");
  };

  const handleSubmitAppeal = async () => {
    if (!appealTarget || justification.trim().length === 0) return;
    setSubmittingAppeal(true);
    setError("");
    try {
      await appealApi.submit(appealTarget.id, justification.trim());
      setSuccessMessage("Recurso submetido com sucesso.");
      setAppealTarget(null);
      setJustification("");
      await loadPenalties();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao submeter recurso";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Create manual penalty handlers
  const openCreate = () => {
    setCreateForm({});
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (submittingCreate) return;
    setCreateOpen(false);
    setCreateForm({});
  };

  const handleCreateManual = async () => {
    const { user_id, reservation_id, type, description } = createForm;
    if (!user_id || !reservation_id || !type || !description?.trim()) return;
    setSubmittingCreate(true);
    setError("");
    try {
      const payload: PenaltyManualCreate = {
        user_id,
        reservation_id,
        type,
        description: description.trim(),
      };
      if (createForm.duration_days !== undefined) {
        payload.duration_days = createForm.duration_days;
      }
      await penaltyApi.createManual(payload);
      setSuccessMessage("Penalidade aplicada com sucesso.");
      setCreateOpen(false);
      setCreateForm({});
      await loadPenalties();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar penalidade";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const createFormValid =
    !!createForm.user_id &&
    !!createForm.reservation_id &&
    !!createForm.type &&
    !!createForm.description?.trim();

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
            Penalidades
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Sanções aplicadas e recursos administrativos
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {isStaff && (
            <Button
              variant="contained"
              color="primary"
              onClick={openCreate}
            >
              Aplicar manual
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPenalties}
            disabled={loading}
            sx={{ borderColor: "rgba(31, 111, 95, 0.3)", color: "text.primary" }}
          >
            Atualizar
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

      {/* Pending Appeals Section */}
      {isStaff && pendingAppeals.length > 0 && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recursos pendentes
          </Typography>
          <Stack spacing={1}>
            {pendingAppeals.map((a) => (
              <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ flex: 1 }}>
                  Recurso #{a.id} — penalidade #{a.penalty_id}
                </Typography>
                <Button size="small" color="success" onClick={() => handleResolve(a.id, true)}>
                  Aprovar
                </Button>
                <Button size="small" color="error" onClick={() => handleResolve(a.id, false)}>
                  Rejeitar
                </Button>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : penalties.length === 0 ? (
        <Alert severity="info">Nenhuma penalidade registrada.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {penalties.map((penalty, index) => {
                  const canAppeal =
                    penalty.status === "APPLIED" &&
                    currentUser !== null &&
                    penalty.user_id === currentUser.id;

                  return (
                    <TableRow
                      key={penalty.id}
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
                      <TableCell>{getUserName(penalty.user_id)}</TableCell>
                      <TableCell>
                        <Chip
                          label={TYPE_LABEL[penalty.type]}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABEL[penalty.status]}
                          size="small"
                          color={STATUS_COLOR[penalty.status]}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 280,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {penalty.description}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(penalty.start_date)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(penalty.end_date)}
                      </TableCell>
                      <TableCell align="center">
                        {canAppeal ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={() => openAppeal(penalty)}
                          >
                            Recorrer
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Appeal Dialog */}
      <Dialog
        open={Boolean(appealTarget)}
        onClose={closeAppeal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submeter recurso</DialogTitle>
        <DialogContent>
          {appealTarget && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Penalidade: <strong>{TYPE_LABEL[appealTarget.type]}</strong>
                {" — "}
                {appealTarget.description}
              </Typography>
              <TextField
                label="Justificativa *"
                multiline
                rows={4}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                fullWidth
                required
                error={justification.trim().length === 0}
                helperText={
                  justification.trim().length === 0
                    ? "A justificativa é obrigatória."
                    : undefined
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeAppeal} disabled={submittingAppeal} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitAppeal}
            disabled={submittingAppeal || justification.trim().length === 0}
          >
            {submittingAppeal ? "Aguarde..." : "Submeter recurso"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Manual Penalty Dialog */}
      <Dialog
        open={createOpen}
        onClose={closeCreate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aplicar penalidade manual</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel id="penalty-user-label">Usuário *</InputLabel>
              <Select
                labelId="penalty-user-label"
                label="Usuário *"
                value={createForm.user_id ?? ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    user_id: Number(e.target.value),
                  }))
                }
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="ID da reserva *"
              type="number"
              value={createForm.reservation_id ?? ""}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  reservation_id: Number(e.target.value) || undefined,
                }))
              }
              fullWidth
              required
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <FormControl fullWidth required>
              <InputLabel id="penalty-type-label">Tipo *</InputLabel>
              <Select
                labelId="penalty-type-label"
                label="Tipo *"
                value={createForm.type ?? ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    type: e.target.value as PenaltyType,
                  }))
                }
              >
                {PENALTY_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Descrição *"
              multiline
              rows={3}
              value={createForm.description ?? ""}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Duração (dias)"
              type="number"
              value={createForm.duration_days ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setCreateForm((prev) => ({
                  ...prev,
                  duration_days: val === "" ? undefined : Number(val),
                }));
              }}
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
              helperText="Opcional"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCreate} disabled={submittingCreate} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateManual}
            disabled={submittingCreate || !createFormValid}
          >
            {submittingCreate ? "Aguarde..." : "Aplicar penalidade"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
