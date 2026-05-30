import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import type { Reservation, Room } from "../../services/api";
import { reservationApi } from "../../services/api";

interface CancelDialogProps {
  reservation: Reservation | null;
  environmentById: Map<number, Room>;
  onClose: () => void;
  onCancelled: (updated: Reservation) => void;
  onError: (message: string) => void;
}

export function CancelDialog({
  reservation,
  environmentById,
  onClose,
  onCancelled,
  onError,
}: CancelDialogProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (reservation) {
      setCancelReason("");
      setError("");
    }
  }, [reservation]);

  const handleCancel = async () => {
    if (!reservation) return;
    if (!cancelReason.trim()) {
      setError("Informe o motivo do cancelamento");
      return;
    }
    setCancelling(true);
    try {
      const updated = await reservationApi.cancel(
        reservation.id,
        cancelReason.trim()
      );
      onCancelled(updated);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao cancelar reserva";
      onError(message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={reservation !== null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar reserva</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {reservation && (
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              {environmentById.get(reservation.environment_id)?.name ?? "Ambiente"}
              {" · "}
              {dayjs(reservation.start_time).format("DD/MM/YYYY HH:mm")} –{" "}
              {dayjs(reservation.end_time).format("HH:mm")}
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
        <Button onClick={onClose}>Voltar</Button>
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
  );
}
