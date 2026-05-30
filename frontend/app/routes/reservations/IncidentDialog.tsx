import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import type { IncidentSeverity, Reservation, Room } from "../../services/api";
import { incidentApi } from "../../services/api";

interface IncidentDialogProps {
  reservation: Reservation | null;
  environmentById: Map<number, Room>;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export function IncidentDialog({
  reservation,
  environmentById,
  onClose,
  onSuccess,
  onError,
}: IncidentDialogProps) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("LOW");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (reservation) {
      setDescription("");
      setSeverity("LOW");
    }
  }, [reservation]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!reservation || !description.trim()) return;
    setSubmitting(true);
    try {
      await incidentApi.create({
        reservation_id: reservation.id,
        description: description.trim(),
        severity,
      });
      onSuccess("Incidente registrado com sucesso.");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao registrar incidente";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={reservation !== null} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar incidente</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, "&.MuiDialogContent-root": { pt: 3 } }}
      >
        {reservation && (
          <Typography variant="body2" color="text.secondary">
            Reserva #{reservation.id} —{" "}
            {environmentById.get(reservation.environment_id)?.name ?? "Ambiente"}
            {" · "}
            {dayjs(reservation.start_time).format("DD/MM/YYYY HH:mm")}
          </Typography>
        )}
        <FormControl fullWidth required>
          <InputLabel id="incident-severity-label">Severidade *</InputLabel>
          <Select
            labelId="incident-severity-label"
            label="Severidade *"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          >
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]).map(
              (s) => (
                <MenuItem key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
        <TextField
          label="Descrição *"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={submitting || !description.trim()}
        >
          {submitting ? "Aguarde..." : "Registrar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
