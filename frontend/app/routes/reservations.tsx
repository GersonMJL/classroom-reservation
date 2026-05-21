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
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { PickerDay } from "@mui/x-date-pickers/PickerDay";
import type { PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import dayjs, { type Dayjs } from "dayjs";

import {
  clearAuthTokens,
  compositeApi,
  environmentApi,
  hasValidAccessToken,
  incidentApi,
  reservationApi,
  ReservationConflictError,
  resourceApi,
  userApi,
} from "../services/api";
import type {
  CompositeReservationCreate,
  IncidentSeverity,
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
  recurring: boolean;
  recurrenceWeekdays: number[];
  recurrenceOccurrences: number;
}

interface CompositeItemDraft {
  environment_id: number | "";
  start_time: Dayjs;
  end_time: Dayjs;
  participant_count: number;
  purpose: string;
  resource_ids: number[];
  critical: boolean;
}

const buildEmptyCompositeItem = (base: Dayjs): CompositeItemDraft => ({
  environment_id: "",
  start_time: base.hour(9).minute(0).second(0).millisecond(0),
  end_time: base.hour(11).minute(0).second(0).millisecond(0),
  participant_count: 1,
  purpose: "",
  resource_ids: [],
  critical: false,
});

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

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
    recurring: false,
    recurrenceWeekdays: [],
    recurrenceOccurrences: 4,
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

  const [incidentTarget, setIncidentTarget] = useState<Reservation | null>(null);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>("LOW");
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);

  const [compositeOpen, setCompositeOpen] = useState(false);
  const [compositeForm, setCompositeForm] = useState<{
    name: string;
    description: string;
    responsible_id: number | "";
    accept_terms: boolean;
    items: CompositeItemDraft[];
  }>({
    name: "",
    description: "",
    responsible_id: "",
    accept_terms: false,
    items: [],
  });
  const [compositeSubmitting, setCompositeSubmitting] = useState(false);
  const [compositeError, setCompositeError] = useState("");

  const isStaff =
    currentUser?.roles.includes("admin") ||
    currentUser?.roles.includes("manager") ||
    currentUser?.roles.includes("technician");

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

  const openIncidentDialog = (reservation: Reservation) => {
    setIncidentTarget(reservation);
    setIncidentDescription("");
    setIncidentSeverity("LOW");
  };

  const closeIncidentDialog = () => {
    if (incidentSubmitting) return;
    setIncidentTarget(null);
    setIncidentDescription("");
    setIncidentSeverity("LOW");
  };

  const handleIncidentSubmit = async () => {
    if (!incidentTarget || !incidentDescription.trim()) return;
    setIncidentSubmitting(true);
    setError("");
    try {
      await incidentApi.create({
        reservation_id: incidentTarget.id,
        description: incidentDescription.trim(),
        severity: incidentSeverity,
      });
      setSuccessMessage("Incidente registrado com sucesso.");
      closeIncidentDialog();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao registrar incidente";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setIncidentSubmitting(false);
    }
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
      recurring: false,
      recurrenceWeekdays: [],
      recurrenceOccurrences: 4,
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
    if (editingId === null && form.recurring) {
      if (form.recurrenceWeekdays.length === 0)
        return "Selecione ao menos um dia da semana";
      if (form.recurrenceOccurrences < 1 || form.recurrenceOccurrences > 52)
        return "Ocorrências deve estar entre 1 e 52";
    }
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
        ...(editingId === null && form.recurring
          ? {
              type: "RECURRING" as const,
              recurrence: {
                weekdays: form.recurrenceWeekdays,
                occurrences: form.recurrenceOccurrences,
              },
            }
          : {}),
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

  const openCompositeDialog = () => {
    const base = dayjs().add(1, "day");
    setCompositeForm({
      name: "",
      description: "",
      responsible_id: currentUser?.id ?? "",
      accept_terms: false,
      items: [buildEmptyCompositeItem(base), buildEmptyCompositeItem(base)],
    });
    setCompositeError("");
    setCompositeOpen(true);
  };

  const closeCompositeDialog = () => {
    setCompositeOpen(false);
    setCompositeError("");
  };

  const handleCompositeSubmit = async () => {
    if (!compositeForm.name.trim()) {
      setCompositeError("Informe o nome da reserva composta");
      return;
    }
    if (compositeForm.responsible_id === "") {
      setCompositeError("Selecione o responsável");
      return;
    }
    if (!compositeForm.accept_terms) {
      setCompositeError("Aceite os termos de responsabilidade para continuar");
      return;
    }
    if (compositeForm.items.length < 2) {
      setCompositeError("A reserva composta deve ter ao menos 2 itens");
      return;
    }
    for (let i = 0; i < compositeForm.items.length; i++) {
      const item = compositeForm.items[i];
      if (item.environment_id === "") {
        setCompositeError(`Item ${i + 1}: selecione o ambiente`);
        return;
      }
      if (!item.purpose.trim()) {
        setCompositeError(`Item ${i + 1}: informe a finalidade`);
        return;
      }
      if (!item.start_time.isValid() || !item.end_time.isValid()) {
        setCompositeError(`Item ${i + 1}: datas inválidas`);
        return;
      }
      if (!item.end_time.isAfter(item.start_time)) {
        setCompositeError(`Item ${i + 1}: o término deve ser depois do início`);
        return;
      }
    }

    setCompositeSubmitting(true);
    setCompositeError("");
    try {
      const payload: CompositeReservationCreate = {
        name: compositeForm.name.trim(),
        description: compositeForm.description.trim() || undefined,
        responsible_id: Number(compositeForm.responsible_id),
        accept_terms: compositeForm.accept_terms,
        items: compositeForm.items.map((item) => ({
          environment_id: Number(item.environment_id),
          start_time: item.start_time.toISOString(),
          end_time: item.end_time.toISOString(),
          participant_count: item.participant_count,
          purpose: item.purpose.trim(),
          resources: item.resource_ids.map((id) => ({ resource_id: id })),
          support: [],
          critical: item.critical,
        })),
      };
      await compositeApi.create(payload);
      await loadReservations(visibleMonth);
      setSuccessMessage("Reserva composta criada com sucesso");
      closeCompositeDialog();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar reserva composta";
      if (!handleAuthError(message)) setCompositeError(message);
    } finally {
      setCompositeSubmitting(false);
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
            startIcon={<AddIcon />}
            onClick={openCompositeDialog}
            disabled={!currentUser}
          >
            Nova composta
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
                        {isStaff && (
                          <Button
                            size="small"
                            color="warning"
                            startIcon={<ReportProblemIcon />}
                            onClick={() => openIncidentDialog(reservation)}
                          >
                            Incidente
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
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.recurring}
                    onChange={(e) =>
                      setForm({ ...form, recurring: e.target.checked })
                    }
                  />
                }
                label="Recorrência semanal"
              />
              {form.recurring && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Dias da semana
                    </Typography>
                    <ToggleButtonGroup
                      value={form.recurrenceWeekdays}
                      onChange={(_, value: number[]) =>
                        setForm({ ...form, recurrenceWeekdays: value })
                      }
                      size="small"
                    >
                      {WEEKDAY_LABELS.map((label, idx) => (
                        <ToggleButton key={idx} value={idx}>
                          {label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                  <TextField
                    type="number"
                    label="Ocorrências"
                    value={form.recurrenceOccurrences}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrenceOccurrences: Math.max(
                          1,
                          Math.min(52, Number(e.target.value) || 1)
                        ),
                      })
                    }
                    slotProps={{ htmlInput: { min: 1, max: 52 } }}
                    sx={{ width: 160 }}
                  />
                </Stack>
              )}
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
            </>
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
      <Dialog
        open={compositeOpen}
        onClose={closeCompositeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nova reserva composta</DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {compositeError && (
            <Alert severity="error">{compositeError}</Alert>
          )}

          <TextField
            fullWidth
            label="Nome da reserva composta"
            value={compositeForm.name}
            onChange={(e) =>
              setCompositeForm({ ...compositeForm, name: e.target.value })
            }
            slotProps={{ htmlInput: { maxLength: 128 } }}
          />

          <TextField
            fullWidth
            label="Descrição (opcional)"
            value={compositeForm.description}
            onChange={(e) =>
              setCompositeForm({
                ...compositeForm,
                description: e.target.value,
              })
            }
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />

          <FormControl fullWidth>
            <InputLabel id="composite-responsible-label">Responsável</InputLabel>
            <Select
              labelId="composite-responsible-label"
              label="Responsável"
              value={compositeForm.responsible_id}
              onChange={(e) =>
                setCompositeForm({
                  ...compositeForm,
                  responsible_id: Number(e.target.value),
                })
              }
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Itens da reserva composta
          </Typography>

          {compositeForm.items.map((item, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Item {idx + 1}
                  </Typography>
                  {compositeForm.items.length > 2 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setCompositeForm({
                          ...compositeForm,
                          items: compositeForm.items.filter((_, i) => i !== idx),
                        })
                      }
                      aria-label="Remover item"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <FormControl fullWidth>
                  <InputLabel id={`composite-env-label-${idx}`}>Ambiente</InputLabel>
                  <Select
                    labelId={`composite-env-label-${idx}`}
                    label="Ambiente"
                    value={item.environment_id}
                    onChange={(e) => {
                      const updated = [...compositeForm.items];
                      updated[idx] = {
                        ...updated[idx],
                        environment_id: Number(e.target.value),
                      };
                      setCompositeForm({ ...compositeForm, items: updated });
                    }}
                  >
                    {environments.map((env) => (
                      <MenuItem key={env.id} value={env.id}>
                        {env.name} · cap. {env.capacity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <DateTimePicker
                    label="Início"
                    value={item.start_time}
                    onChange={(value) => {
                      if (!value) return;
                      const updated = [...compositeForm.items];
                      updated[idx] = { ...updated[idx], start_time: value };
                      setCompositeForm({ ...compositeForm, items: updated });
                    }}
                    sx={{ flex: 1 }}
                  />
                  <DateTimePicker
                    label="Término"
                    value={item.end_time}
                    onChange={(value) => {
                      if (!value) return;
                      const updated = [...compositeForm.items];
                      updated[idx] = { ...updated[idx], end_time: value };
                      setCompositeForm({ ...compositeForm, items: updated });
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label="Finalidade"
                  value={item.purpose}
                  onChange={(e) => {
                    const updated = [...compositeForm.items];
                    updated[idx] = { ...updated[idx], purpose: e.target.value };
                    setCompositeForm({ ...compositeForm, items: updated });
                  }}
                  slotProps={{ htmlInput: { maxLength: 128 } }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Participantes"
                  value={item.participant_count}
                  onChange={(e) => {
                    const updated = [...compositeForm.items];
                    updated[idx] = {
                      ...updated[idx],
                      participant_count: Math.max(1, Number(e.target.value) || 1),
                    };
                    setCompositeForm({ ...compositeForm, items: updated });
                  }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />

                <Autocomplete
                  multiple
                  options={resources}
                  getOptionLabel={(option) => `${option.name} · ${option.type}`}
                  value={resources.filter((r) =>
                    item.resource_ids.includes(r.id)
                  )}
                  onChange={(_, value) => {
                    const updated = [...compositeForm.items];
                    updated[idx] = {
                      ...updated[idx],
                      resource_ids: value.map((v) => v.id),
                    };
                    setCompositeForm({ ...compositeForm, items: updated });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Recursos"
                      placeholder="Adicionar recurso"
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.critical}
                      onChange={(e) => {
                        const updated = [...compositeForm.items];
                        updated[idx] = {
                          ...updated[idx],
                          critical: e.target.checked,
                        };
                        setCompositeForm({ ...compositeForm, items: updated });
                      }}
                    />
                  }
                  label="Item crítico"
                />
              </Stack>
            </Paper>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const base = dayjs().add(1, "day");
              setCompositeForm({
                ...compositeForm,
                items: [
                  ...compositeForm.items,
                  buildEmptyCompositeItem(base),
                ],
              });
            }}
          >
            Adicionar item
          </Button>

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={compositeForm.accept_terms}
                onChange={(e) =>
                  setCompositeForm({
                    ...compositeForm,
                    accept_terms: e.target.checked,
                  })
                }
              />
            }
            label="Aceito os termos de responsabilidade pelo uso dos ambientes."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCompositeDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCompositeSubmit}
            disabled={compositeSubmitting}
          >
            Criar composta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Incident Dialog */}
      <Dialog
        open={incidentTarget !== null}
        onClose={closeIncidentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar incidente</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {incidentTarget && (
            <Typography variant="body2" color="text.secondary">
              Reserva #{incidentTarget.id} —{" "}
              {environmentById.get(incidentTarget.environment_id)?.name ?? "Ambiente"}
              {" · "}
              {dayjs(incidentTarget.start_time).format("DD/MM/YYYY HH:mm")}
            </Typography>
          )}
          <FormControl fullWidth required>
            <InputLabel id="incident-severity-dlg-label">Severidade *</InputLabel>
            <Select
              labelId="incident-severity-dlg-label"
              label="Severidade *"
              value={incidentSeverity}
              onChange={(e) =>
                setIncidentSeverity(e.target.value as IncidentSeverity)
              }
            >
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]).map((s) => {
                const labels: Record<IncidentSeverity, string> = {
                  LOW: "Baixa",
                  MEDIUM: "Média",
                  HIGH: "Alta",
                  CRITICAL: "Crítica",
                };
                return (
                  <MenuItem key={s} value={s}>
                    {labels[s]}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            label="Descrição *"
            multiline
            rows={4}
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIncidentDialog} disabled={incidentSubmitting} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleIncidentSubmit}
            disabled={incidentSubmitting || !incidentDescription.trim()}
          >
            {incidentSubmitting ? "Aguarde..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
