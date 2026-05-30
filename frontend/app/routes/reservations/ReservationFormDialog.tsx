import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import type {
  Reservation,
  ReservationConflictDetail,
  ReservationCreate,
  ReservationPurpose,
  Resource,
  Room,
  User,
} from "../../services/api";
import { ReservationConflictError, reservationApi } from "../../services/api";
import {
  MIN_TIME,
  MAX_TIME,
  WEEKDAY_LABELS,
  toIdOrEmpty,
  dateOrInvalid,
  RESERVATION_PURPOSE_OPTIONS,
  toPurposeValue,
} from "./constants";

interface FormState {
  environment_id: number | "";
  responsible_id: number | "";
  start_time: Dayjs;
  end_time: Dayjs;
  purpose: ReservationPurpose | "";
  participant_count: number;
  resource_ids: number[];
  acceptTerms: boolean;
  recurring: boolean;
  recurrenceWeekdays: number[];
  recurrenceOccurrences: number;
}

const buildInitialForm = (): FormState => {
  const start = dayjs().add(1, "day").hour(9).minute(0).second(0).millisecond(0);
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

interface ReservationFormDialogProps {
  open: boolean;
  editingReservation: Reservation | null;
  selectedDate: Dayjs;
  environments: Room[];
  resources: Resource[];
  users: User[];
  currentUser: User;
  onClose: () => void;
  onCreated: (reservation: Reservation) => void;
  onUpdated: (reservation: Reservation) => void;
  onError: (message: string) => void;
}

export function ReservationFormDialog({
  open,
  editingReservation,
  selectedDate,
  environments,
  resources,
  users,
  currentUser,
  onClose,
  onCreated,
  onUpdated,
  onError,
}: ReservationFormDialogProps) {
  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [formError, setFormError] = useState("");
  const [formConflicts, setFormConflicts] = useState<ReservationConflictDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Intentionally depends only on [open]: form resets when dialog opens, not on every selectedDate/currentUser change.
  useEffect(() => {
    if (!open) return;
    setFormError("");
    setFormConflicts([]);
    if (editingReservation) {
      setForm({
        environment_id: editingReservation.environment_id,
        responsible_id: editingReservation.responsible_id,
        start_time: dayjs(editingReservation.start_time),
        end_time: dayjs(editingReservation.end_time),
        purpose: toPurposeValue(editingReservation.purpose),
        participant_count: editingReservation.participant_count,
        resource_ids: editingReservation.resources.map((r) => r.resource_id),
        acceptTerms: false,
        recurring: false,
        recurrenceWeekdays: [],
        recurrenceOccurrences: 4,
      });
    } else {
      const base = buildInitialForm();
      setForm({
        ...base,
        responsible_id: currentUser.id,
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
    }
  }, [open]);

  const validate = (): string | null => {
    if (form.environment_id === "") return "Selecione um ambiente";
    if (form.responsible_id === "") return "Selecione um responsável";
    if (form.purpose === "") return "Selecione a finalidade da reserva";
    if (form.participant_count < 1) return "Número de participantes inválido";
    if (!form.start_time.isValid() || !form.end_time.isValid())
      return "Datas inválidas";
    if (!form.end_time.isAfter(form.start_time))
      return "O término deve ser depois do início";
    if (editingReservation === null && !form.acceptTerms)
      return "Aceite os termos de responsabilidade para continuar";
    if (editingReservation === null && form.recurring) {
      if (form.recurrenceWeekdays.length === 0)
        return "Selecione ao menos um dia da semana";
      if (form.recurrenceOccurrences < 1 || form.recurrenceOccurrences > 52)
        return "Ocorrências deve estar entre 1 e 52";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
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
        purpose: form.purpose as ReservationPurpose,
        participant_count: form.participant_count,
        accept_terms: form.acceptTerms,
        resources: form.resource_ids.map((id) => ({ resource_id: id })),
        support: [],
        ...(editingReservation === null && form.recurring
          ? {
              type: "RECURRING" as const,
              recurrence: {
                weekdays: form.recurrenceWeekdays,
                occurrences: form.recurrenceOccurrences,
              },
            }
          : {}),
      };

      if (editingReservation !== null) {
        const updated = await reservationApi.update(editingReservation.id, {
          environment_id: payload.environment_id,
          responsible_id: payload.responsible_id,
          start_time: payload.start_time,
          end_time: payload.end_time,
          purpose: payload.purpose,
          participant_count: payload.participant_count,
          resources: payload.resources,
        });
        onUpdated(updated);
      } else {
        const created = await reservationApi.create(payload);
        onCreated(created);
      }
      onClose();
    } catch (err) {
      if (err instanceof ReservationConflictError) {
        setFormError(err.message);
        setFormConflicts(err.conflicts);
      } else {
        const message =
          err instanceof Error ? err.message : "Falha ao salvar reserva";
        onError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingReservation !== null ? "Editar reserva" : "Nova reserva"}
      </DialogTitle>
      <DialogContent
        sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
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
              setForm((prev) => ({ ...prev, start_time: dateOrInvalid(value) }))
            }
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            sx={{ flex: 1 }}
          />
          <DateTimePicker
            label="Término"
            value={form.end_time}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, end_time: dateOrInvalid(value) }))
            }
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
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
              setForm((prev) => ({
                ...prev,
                environment_id: toIdOrEmpty(e.target.value),
              }))
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
              setForm((prev) => ({
                ...prev,
                responsible_id: toIdOrEmpty(e.target.value),
              }))
            }
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="purpose-label">Finalidade</InputLabel>
          <Select
            labelId="purpose-label"
            label="Finalidade"
            value={form.purpose}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                purpose: e.target.value as ReservationPurpose,
              }))
            }
          >
            {RESERVATION_PURPOSE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="number"
          label="Participantes"
          value={form.participant_count}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              participant_count: Math.max(1, Number(e.target.value) || 1),
            }))
          }
          slotProps={{ htmlInput: { min: 1 } }}
        />

        <Autocomplete
          multiple
          options={resources}
          getOptionLabel={(option) => `${option.name} · ${option.type}`}
          value={resources.filter((r) => form.resource_ids.includes(r.id))}
          onChange={(_, value) =>
            setForm((prev) => ({ ...prev, resource_ids: value.map((v) => v.id) }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Recursos"
              placeholder="Adicionar recurso"
            />
          )}
        />

        {editingReservation === null && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={form.recurring}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, recurring: e.target.checked }))
                  }
                />
              }
              label="Recorrência semanal"
            />
            {form.recurring && (
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Dias da semana
                  </Typography>
                  <ToggleButtonGroup
                    value={form.recurrenceWeekdays}
                    onChange={(_, value: number[]) =>
                      setForm((prev) => ({ ...prev, recurrenceWeekdays: value }))
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
                    setForm((prev) => ({
                      ...prev,
                      recurrenceOccurrences: Math.max(
                        1,
                        Math.min(52, Number(e.target.value) || 1)
                      ),
                    }))
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
                    setForm((prev) => ({ ...prev, acceptTerms: e.target.checked }))
                  }
                />
              }
              label="Aceito os termos de responsabilidade pelo uso do ambiente."
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {editingReservation !== null ? "Salvar" : "Solicitar reserva"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
