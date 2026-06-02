import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { CompositeReservation, Reservation, Room } from "../../services/api";
import { compositeApi } from "../../services/api";
import { STATUS_COLOR, STATUS_LABEL } from "./constants";

interface CompositeManageDialogProps {
  /** The composite reservation to manage. Null means the dialog is closed. */
  composite: CompositeReservation | null;
  /** Map from reservation_id → Reservation for resolving item details. */
  reservationsById: Map<number, Reservation>;
  environmentById: Map<number, Room>;
  onClose: () => void;
  onUpdated: (updated: CompositeReservation) => void;
  onError: (message: string) => void;
}

export function CompositeManageDialog({
  composite,
  reservationsById,
  environmentById,
  onClose,
  onUpdated,
  onError,
}: CompositeManageDialogProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [reasonForItem, setReasonForItem] = useState<Map<number, string>>(
    new Map(),
  );
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmingNonCriticalId, setConfirmingNonCriticalId] = useState<number | null>(null);

  if (!composite) return null;

  const handleReasonChange = (reservationId: number, value: string) => {
    setReasonForItem((prev) => {
      const next = new Map(prev);
      next.set(reservationId, value);
      return next;
    });
  };

  const startCancel = (reservationId: number, critical: boolean) => {
    if (critical) {
      setConfirmingId(reservationId);
    } else {
      setConfirmingNonCriticalId(reservationId);
    }
  };

  const confirmNonCritical = (reservationId: number) => {
    setConfirmingNonCriticalId(null);
    setCancellingId(reservationId);
  };

  const confirmCritical = (reservationId: number) => {
    setConfirmingId(null);
    setCancellingId(reservationId);
  };

  const submitCancel = async (reservationId: number) => {
    const reason = (reasonForItem.get(reservationId) ?? "").trim();
    if (!reason) return;

    try {
      const updated = await compositeApi.cancelItem(
        composite.id,
        reservationId,
        reason,
      );
      onUpdated(updated);
      setCancellingId(null);
      setReasonForItem((prev) => {
        const next = new Map(prev);
        next.delete(reservationId);
        return next;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao cancelar item";
      onError(message);
      setCancellingId(null);
    }
  };

  return (
    <>
      {/* Critical item confirmation dialog */}
      <Dialog
        open={confirmingId !== null}
        onClose={() => setConfirmingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="error" />
          Item crítico
        </DialogTitle>
        <DialogContent>
          <Typography>
            Este item é crítico. Cancelá-lo colocará os demais itens ativos em
            revisão obrigatória. Deseja continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingId(null)}>Voltar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => confirmingId !== null && confirmCritical(confirmingId)}
            sx={{ "&:active": { transform: "scale(0.97)" } }}
          >
            Sim, cancelar item crítico
          </Button>
        </DialogActions>
      </Dialog>

      {/* Non-critical item confirmation dialog */}
      <Dialog
        open={confirmingNonCriticalId !== null}
        onClose={() => setConfirmingNonCriticalId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BlockIcon color="error" />
          Cancelar item
        </DialogTitle>
        <DialogContent>
          <Typography>
            Cancelar este item? Confirme se o restante do evento ainda é viável.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingNonCriticalId(null)}>Voltar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              confirmingNonCriticalId !== null &&
              confirmNonCritical(confirmingNonCriticalId)
            }
            sx={{ "&:active": { transform: "scale(0.97)" } }}
          >
            Sim, cancelar item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main composite management dialog */}
      <Dialog open={composite !== null} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              {composite.name}
            </Typography>
            {composite.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {composite.description}
              </Typography>
            )}
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            "&.MuiDialogContent-root": { pt: 3 },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Itens da reserva ({composite.items.length})
          </Typography>

          {composite.items.map((item) => {
            const reservation = reservationsById.get(item.reservation_id);
            const env = reservation
              ? environmentById.get(reservation.environment_id)
              : undefined;
            const isCancelling = cancellingId === item.reservation_id;
            const reason = reasonForItem.get(item.reservation_id) ?? "";
            const isCancelled = reservation?.status === "CANCELLED";

            return (
              <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    sx={{
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Item {item.order + 1}
                        </Typography>
                        {item.critical && (
                          <Chip
                            size="small"
                            label="Crítico"
                            color="error"
                            variant="outlined"
                            icon={<WarningAmberIcon />}
                          />
                        )}
                        {reservation && (
                          <Chip
                            size="small"
                            label={STATUS_LABEL[reservation.status]}
                            color={STATUS_COLOR[reservation.status]}
                          />
                        )}
                      </Stack>
                      {reservation && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {env?.name ?? `Ambiente #${reservation.environment_id}`}
                          {" · "}
                          {new Date(reservation.start_time).toLocaleString(
                            "pt-BR",
                            { dateStyle: "short", timeStyle: "short" },
                          )}{" "}
                          –{" "}
                          {new Date(reservation.end_time).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </Typography>
                      )}
                      {!reservation && (
                        <Typography variant="body2" color="text.secondary">
                          Reserva #{item.reservation_id}
                        </Typography>
                      )}
                    </Box>

                    {!isCancelled && !isCancelling && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<BlockIcon />}
                        onClick={() =>
                          startCancel(item.reservation_id, item.critical)
                        }
                        sx={{ "&:active": { transform: "scale(0.97)" }, flexShrink: 0 }}
                      >
                        Cancelar item
                      </Button>
                    )}
                  </Stack>

                  {isCancelling && (
                    <>
                      <Divider />
                      {item.critical && (
                        <Alert severity="warning" icon={<WarningAmberIcon />}>
                          Item crítico — os demais itens ativos serão colocados em
                          revisão obrigatória após o cancelamento.
                        </Alert>
                      )}
                      <TextField
                        label="Motivo do cancelamento"
                        value={reason}
                        onChange={(e) =>
                          handleReasonChange(item.reservation_id, e.target.value)
                        }
                        multiline
                        minRows={2}
                        fullWidth
                        slotProps={{ htmlInput: { maxLength: 500 } }}
                        autoFocus
                      />
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          onClick={() => setCancellingId(null)}
                        >
                          Voltar
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          disabled={!reason.trim()}
                          onClick={() => submitCancel(item.reservation_id)}
                          sx={{ "&:active": { transform: "scale(0.97)" } }}
                        >
                          Confirmar cancelamento
                        </Button>
                      </Stack>
                    </>
                  )}

                  {isCancelled && (
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ fontStyle: "italic" }}
                    >
                      Item cancelado
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })}

          {composite.items.length === 0 && (
            <Alert severity="info" variant="outlined">
              Esta reserva composta não possui itens.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
