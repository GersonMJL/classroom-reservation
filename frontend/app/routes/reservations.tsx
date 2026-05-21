import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { PickerDay } from "@mui/x-date-pickers/PickerDay";
import type { PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import dayjs, { type Dayjs } from "dayjs";

import {
  clearAuthTokens,
  environmentApi,
  hasValidAccessToken,
  reservationApi,
  ReservationConflictError,
  resourceApi,
  userApi,
} from "../services/api";
import type {
  Reservation,
  ReservationConflictDetail,
  ReservationCreate,
  ReservationStatus,
  Resource,
  Room,
  User,
} from "../services/api";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_APPROVAL: "Pendente",
  PRE_BLOCKED: "Pré-bloqueada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
  IN_USE: "Em uso",
  COMPLETED: "Concluída",
  NO_SHOW: "Não compareceu",
  EXPIRED: "Expirada",
};

const STATUS_COLOR: Record<ReservationStatus, ChipProps["color"]> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  PRE_BLOCKED: "info",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "default",
  IN_USE: "primary",
  COMPLETED: "success",
  NO_SHOW: "error",
  EXPIRED: "default",
};

const EDITABLE_STATUSES: ReservationStatus[] = ["DRAFT", "PENDING_APPROVAL"];
const CANCELLABLE_STATUSES: ReservationStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "PRE_BLOCKED",
  "APPROVED",
  "IN_USE",
];

interface FormState {
  environment_id: number | "";
  responsible_id: number | "";
  start_time: Dayjs;
  end_time: Dayjs;
  purpose: string;
  participant_count: number;
  resource_ids: number[];
  acceptTerms: boolean;
}

const buildInitialForm = (): FormState => {
  const start = dayjs()
    .add(1, "day")
    .hour(9)
    .minute(0)
    .second(0)
    .millisecond(0);
  return {
    environment_id: "",
    responsible_id: "",
    start_time: start,
    end_time: start.add(2, "hour"),
    purpose: "",
    participant_count: 1,
    resource_ids: [],
    acceptTerms: false,
  };
};

export default function ReservationsPage() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [environments, setEnvironments] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(dayjs());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(buildInitialForm());
  const [formError, setFormError] = useState("");
  const [formConflicts, setFormConflicts] = useState<ReservationConflictDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  const loadReservations = async (month: Dayjs) => {
    setLoading(true);
    setError("");
    try {
      const start = month.startOf("month").toISOString();
      const end = month.endOf("month").toISOString();
      const data = await reservationApi.list({
        start_after: start,
        end_before: end,
        limit: 500,
      });
      setReservations(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao carregar reservas";
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
        const [envs, res, allUsers, me] = await Promise.all([
          environmentApi.getAllRooms(0, 500),
          resourceApi.getAllResources(0, 500, true),
          userApi.getAllUsers(0, 500),
          userApi.getCurrentUser(),
        ]);
        setEnvironments(envs);
        setResources(res);
        setUsers(allUsers);
        setCurrentUser(me);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados auxiliares";
        if (!handleAuthError(message)) setError(message);
      }
    };
    bootstrap();
    loadReservations(visibleMonth);
  }, [navigate]);

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      const key = dayjs(r.start_time).format("YYYY-MM-DD");
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [reservations]);

  const dayReservations = useMemo(() => {
    const key = selectedDate.format("YYYY-MM-DD");
    return reservationsByDay.get(key) ?? [];
  }, [reservationsByDay, selectedDate]);

  const environmentById = useMemo(() => {
    const map = new Map<number, Room>();
    for (const e of environments) map.set(e.id, e);
    return map;
  }, [environments]);

  const openCreateDialog = () => {
    setEditingId(null);
    const base = buildInitialForm();
    setForm({
      ...base,
      responsible_id: currentUser?.id ?? "",
      start_time: selectedDate
        .hour(base.start_time.hour())
        .minute(0)
        .second(0)
        .millisecond(0),
      end_time: selectedDate
        .hour(base.end_time.hour())
        .minute(0)
        .second(0)
        .millisecond(0),
    });
    setFormError("");
    setFormConflicts([]);
    setIsFormOpen(true);
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingId(reservation.id);
    setForm({
      environment_id: reservation.environment_id,
      responsible_id: reservation.responsible_id,
      start_time: dayjs(reservation.start_time),
      end_time: dayjs(reservation.end_time),
      purpose: reservation.purpose,
      participant_count: reservation.participant_count,
      resource_ids: reservation.resources.map((r) => r.resource_id),
      acceptTerms: false,
    });
    setFormError("");
    setFormConflicts([]);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setFormError("");
    setFormConflicts([]);
  };

  const validateForm = (): string | null => {
    if (form.environment_id === "") return "Selecione um ambiente";
    if (form.responsible_id === "") return "Selecione um responsável";
    if (!form.purpose.trim()) return "Informe a finalidade da reserva";
    if (form.participant_count < 1) return "Número de participantes inválido";
    if (!form.start_time.isValid() || !form.end_time.isValid())
      return "Datas inválidas";
    if (!form.end_time.isAfter(form.start_time))
      return "O término deve ser depois do início";
    if (editingId === null && !form.acceptTerms)
      return "Aceite os termos de responsabilidade para continuar";
    return null;
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }
    if (!currentUser) {
      setFormError("Usuário não carregado");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormConflicts([]);
    try {
      const payload: ReservationCreate = {
        environment_id: Number(form.environment_id),
        requester_id: currentUser.id,
        responsible_id: Number(form.responsible_id),
        start_time: form.start_time.toISOString(),
        end_time: form.end_time.toISOString(),
        purpose: form.purpose.trim(),
        participant_count: form.participant_count,
        accept_terms: form.acceptTerms,
        resources: form.resource_ids.map((id) => ({ resource_id: id })),
        support: [],
      };

      if (editingId !== null) {
        const updated = await reservationApi.update(editingId, {
          environment_id: payload.environment_id,
          responsible_id: payload.responsible_id,
          start_time: payload.start_time,
          end_time: payload.end_time,
          purpose: payload.purpose,
          participant_count: payload.participant_count,
          resources: payload.resources,
        });
        setReservations((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        setSuccessMessage("Reserva atualizada");
      } else {
        const created = await reservationApi.create(payload);
        setReservations((prev) => [...prev, created]);
        setSuccessMessage("Reserva criada e aguardando aprovação");
      }
      closeFormDialog();
    } catch (err) {
      if (err instanceof ReservationConflictError) {
        setFormError(err.message);
        setFormConflicts(err.conflicts);
      } else {
        const message =
          err instanceof Error ? err.message : "Falha ao salvar reserva";
        if (!handleAuthError(message)) setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelDialog = (reservation: Reservation) => {
    setCancelTarget(reservation);
    setCancelReason("");
  };

  const closeCancelDialog = () => {
    setCancelTarget(null);
    setCancelReason("");
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      setError("Informe o motivo do cancelamento");
      return;
    }
    setCancelling(true);
    try {
      const updated = await reservationApi.cancel(
        cancelTarget.id,
        cancelReason.trim()
      );
      setReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setSuccessMessage("Reserva cancelada");
      closeCancelDialog();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao cancelar reserva";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Reservas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Solicite e acompanhe as reservas dos ambientes da instituição.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            disabled={!currentUser}
          >
            Nova reserva
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadReservations(visibleMonth)}
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
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(320px, 380px) 1fr" },
          alignItems: "start",
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Calendário
          </Typography>
          <DateCalendar
            value={selectedDate}
            onChange={(value) => value && setSelectedDate(value)}
            onMonthChange={(month) => {
              setVisibleMonth(month);
              loadReservations(month);
            }}
            slots={{
              day: (props: PickerDayProps) => {
                const key = dayjs(props.day as Dayjs).format("YYYY-MM-DD");
                const hasReservations = reservationsByDay.has(key);
                return (
                  <Badge
                    overlap="circular"
                    variant="dot"
                    color="primary"
                    invisible={!hasReservations}
                  >
                    <PickerDay {...props} />
                  </Badge>
                );
              },
            }}
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Agenda — {selectedDate.format("DD [de] MMMM [de] YYYY")}
            </Typography>
            {loading && <CircularProgress size={18} />}
          </Stack>

          {dayReservations.length === 0 ? (
            <Alert severity="info" variant="outlined">
              Nenhuma reserva neste dia.
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {dayReservations.map((reservation, index) => {
                const env = environmentById.get(reservation.environment_id);
                const editable = EDITABLE_STATUSES.includes(reservation.status);
                const cancellable = CANCELLABLE_STATUSES.includes(
                  reservation.status
                );
                return (
                  <Paper
                    key={reservation.id}
                    variant="outlined"
                    sx={{
                      p: 2,
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
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {dayjs(reservation.start_time).format("HH:mm")} –{" "}
                          {dayjs(reservation.end_time).format("HH:mm")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {env?.name ?? `Ambiente #${reservation.environment_id}`}
                          {" · "}
                          {reservation.participant_count} participante
                          {reservation.participant_count === 1 ? "" : "s"}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {reservation.purpose}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <Chip
                          size="small"
                          label={STATUS_LABEL[reservation.status]}
                          color={STATUS_COLOR[reservation.status]}
                        />
                        {editable && (
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => openEditDialog(reservation)}
                          >
                            Editar
                          </Button>
                        )}
                        {cancellable && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<EventBusyIcon />}
                            onClick={() => openCancelDialog(reservation)}
                          >
                            Cancelar
                          </Button>
                        )}
                        {reservation.status === "APPROVED" &&
                          currentUser &&
                          (currentUser.id === reservation.requester_id ||
                            currentUser.id === reservation.responsible_id) && (
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<LoginIcon />}
                              onClick={async () => {
                                try {
                                  const updated = await reservationApi.checkin(
                                    reservation.id
                                  );
                                  setReservations((prev) =>
                                    prev.map((r) =>
                                      r.id === updated.id ? updated : r
                                    )
                                  );
                                  setSuccessMessage("Check-in registrado");
                                } catch (err) {
                                  const message =
                                    err instanceof Error
                                      ? err.message
                                      : "Falha ao registrar check-in";
                                  if (!handleAuthError(message))
                                    setError(message);
                                }
                              }}
                            >
                              Check-in
                            </Button>
                          )}
                        {reservation.status === "IN_USE" &&
                          currentUser &&
                          (currentUser.id === reservation.requester_id ||
                            currentUser.id === reservation.responsible_id) && (
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<LogoutIcon />}
                              onClick={async () => {
                                try {
                                  const updated = await reservationApi.checkout(
                                    reservation.id
                                  );
                                  setReservations((prev) =>
                                    prev.map((r) =>
                                      r.id === updated.id ? updated : r
                                    )
                                  );
                                  setSuccessMessage("Check-out registrado");
                                } catch (err) {
                                  const message =
                                    err instanceof Error
                                      ? err.message
                                      : "Falha ao registrar check-out";
                                  if (!handleAuthError(message))
                                    setError(message);
                                }
                              }}
                            >
                              Check-out
                            </Button>
                          )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog
        open={isFormOpen}
        onClose={closeFormDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId !== null ? "Editar reserva" : "Nova reserva"}
        </DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {formError && (
            <Alert severity={formConflicts.length ? "warning" : "error"}>
              <AlertTitle>{formError}</AlertTitle>
              {formConflicts.length > 0 && (
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {formConflicts.map((c, idx) => (
                    <li key={idx}>{c.detail}</li>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DateTimePicker
              label="Início"
              value={form.start_time}
              onChange={(value) =>
                value && setForm({ ...form, start_time: value })
              }
              sx={{ flex: 1 }}
            />
            <DateTimePicker
              label="Término"
              value={form.end_time}
              onChange={(value) =>
                value && setForm({ ...form, end_time: value })
              }
              sx={{ flex: 1 }}
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel id="env-label">Ambiente</InputLabel>
            <Select
              labelId="env-label"
              label="Ambiente"
              value={form.environment_id}
              onChange={(e) =>
                setForm({ ...form, environment_id: Number(e.target.value) })
              }
            >
              {environments.map((env) => (
                <MenuItem key={env.id} value={env.id}>
                  {env.name} · cap. {env.capacity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="responsible-label">Responsável</InputLabel>
            <Select
              labelId="responsible-label"
              label="Responsável"
              value={form.responsible_id}
              onChange={(e) =>
                setForm({ ...form, responsible_id: Number(e.target.value) })
              }
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Finalidade"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="Ex.: Aula de Banco de Dados"
            slotProps={{ htmlInput: { maxLength: 128 } }}
          />

          <TextField
            fullWidth
            type="number"
            label="Participantes"
            value={form.participant_count}
            onChange={(e) =>
              setForm({
                ...form,
                participant_count: Math.max(1, Number(e.target.value) || 1),
              })
            }
            slotProps={{ htmlInput: { min: 1 } }}
          />

          <Autocomplete
            multiple
            options={resources}
            getOptionLabel={(option) => `${option.name} · ${option.type}`}
            value={resources.filter((r) => form.resource_ids.includes(r.id))}
            onChange={(_, value) =>
              setForm({ ...form, resource_ids: value.map((v) => v.id) })
            }
            renderInput={(params) => (
              <TextField {...params} label="Recursos" placeholder="Adicionar recurso" />
            )}
          />

          {editingId === null && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.acceptTerms}
                  onChange={(e) =>
                    setForm({ ...form, acceptTerms: e.target.checked })
                  }
                />
              }
              label="Aceito os termos de responsabilidade pelo uso do ambiente."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFormDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {editingId !== null ? "Salvar" : "Solicitar reserva"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelTarget !== null}
        onClose={closeCancelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancelar reserva</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {cancelTarget && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {environmentById.get(cancelTarget.environment_id)?.name ?? "Ambiente"}
                {" · "}
                {dayjs(cancelTarget.start_time).format("DD/MM/YYYY HH:mm")} –{" "}
                {dayjs(cancelTarget.end_time).format("HH:mm")}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                multiline
                minRows={3}
                label="Motivo do cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog}>Voltar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancel}
            disabled={cancelling}
          >
            Confirmar cancelamento
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
