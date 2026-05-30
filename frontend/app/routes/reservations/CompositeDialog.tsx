import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
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
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import type { CompositeReservationCreate, Resource, Room, User } from "../../services/api";
import { compositeApi } from "../../services/api";
import { MIN_TIME, MAX_TIME } from "./constants";

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

interface CompositeDialogProps {
  open: boolean;
  currentUser: User | null;
  environments: Room[];
  resources: Resource[];
  users: User[];
  onClose: () => void;
  onCreated: () => Promise<void>;
  onError: (message: string) => void;
}

export function CompositeDialog({
  open,
  currentUser,
  environments,
  resources,
  users,
  onClose,
  onCreated,
  onError,
}: CompositeDialogProps) {
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
  const [compositeError, setCompositeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Intentionally depends only on [open]: form resets when dialog opens, not on every currentUser change.
  useEffect(() => {
    if (open) {
      const base = dayjs().add(1, "day");
      setCompositeForm({
        name: "",
        description: "",
        responsible_id: currentUser?.id ?? "",
        accept_terms: false,
        items: [buildEmptyCompositeItem(base), buildEmptyCompositeItem(base)],
      });
      setCompositeError("");
    }
  }, [open]);

  const handleSubmit = async () => {
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

    setSubmitting(true);
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
      await onCreated();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar reserva composta";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<CompositeItemDraft>) => {
    const updated = [...compositeForm.items];
    updated[idx] = { ...updated[idx], ...patch };
    setCompositeForm({ ...compositeForm, items: updated });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nova reserva composta</DialogTitle>
      <DialogContent
        sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}
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
            setCompositeForm({ ...compositeForm, description: e.target.value })
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
                  onChange={(e) =>
                    updateItem(idx, { environment_id: Number(e.target.value) })
                  }
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
                    updateItem(idx, { start_time: value });
                  }}
                  minTime={MIN_TIME}
                  maxTime={MAX_TIME}
                  sx={{ flex: 1 }}
                />
                <DateTimePicker
                  label="Término"
                  value={item.end_time}
                  onChange={(value) => {
                    if (!value) return;
                    updateItem(idx, { end_time: value });
                  }}
                  minTime={MIN_TIME}
                  maxTime={MAX_TIME}
                  sx={{ flex: 1 }}
                />
              </Stack>

              <TextField
                fullWidth
                label="Finalidade"
                value={item.purpose}
                onChange={(e) => updateItem(idx, { purpose: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 128 } }}
              />

              <TextField
                fullWidth
                type="number"
                label="Participantes"
                value={item.participant_count}
                onChange={(e) =>
                  updateItem(idx, {
                    participant_count: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />

              <Autocomplete
                multiple
                options={resources}
                getOptionLabel={(option) => `${option.name} · ${option.type}`}
                value={resources.filter((r) => item.resource_ids.includes(r.id))}
                onChange={(_, value) =>
                  updateItem(idx, { resource_ids: value.map((v) => v.id) })
                }
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
                    onChange={(e) =>
                      updateItem(idx, { critical: e.target.checked })
                    }
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
              items: [...compositeForm.items, buildEmptyCompositeItem(base)],
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Criar composta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
