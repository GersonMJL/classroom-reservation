import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import dayjs from "dayjs";
import type { Reservation, Room, User } from "../../services/api";
import { reservationApi } from "../../services/api";
import {
  CANCELLABLE_STATUSES,
  EDITABLE_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
  formatPurpose,
} from "./constants";

interface ReservationCardProps {
  reservation: Reservation;
  index: number;
  environmentById: Map<number, Room>;
  currentUser: User | null;
  isStaff: boolean;
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
  onUpdated: (updated: Reservation) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onIncident: (reservation: Reservation) => void;
  onManageComposite?: (reservation: Reservation) => void;
}

export function ReservationCard({
  reservation,
  index,
  environmentById,
  currentUser,
  isStaff,
  onEdit,
  onCancel,
  onUpdated,
  onSuccess,
  onError,
  onIncident,
  onManageComposite,
}: ReservationCardProps) {
  const env = environmentById.get(reservation.environment_id);
  const editable = EDITABLE_STATUSES.includes(reservation.status);
  const cancellable = CANCELLABLE_STATUSES.includes(reservation.status);
  const isOwner =
    currentUser !== null &&
    (currentUser.id === reservation.requester_id ||
      currentUser.id === reservation.responsible_id);

  const handleCheckin = async () => {
    try {
      const updated = await reservationApi.checkin(reservation.id);
      onUpdated(updated);
      onSuccess("Check-in registrado");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao registrar check-in";
      onError(message);
    }
  };

  const handleCheckout = async () => {
    try {
      const updated = await reservationApi.checkout(reservation.id);
      onUpdated(updated);
      onSuccess("Check-out registrado");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao registrar check-out";
      onError(message);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        animation: `fadeUp 240ms cubic-bezier(0.23, 1, 0.32, 1) both`,
        animationDelay: `${Math.min(index, 6) * 40}ms`,
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
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
            {formatPurpose(reservation.purpose)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            size="small"
            label={STATUS_LABEL[reservation.status]}
            color={STATUS_COLOR[reservation.status]}
          />
          {editable && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(reservation)}
            >
              Editar
            </Button>
          )}
          {cancellable && (
            <Button
              size="small"
              color="error"
              startIcon={<EventBusyIcon />}
              onClick={() => onCancel(reservation)}
            >
              Cancelar
            </Button>
          )}
          {reservation.status === "APPROVED" && isOwner && (
            <Button
              size="small"
              color="primary"
              startIcon={<LoginIcon />}
              onClick={handleCheckin}
            >
              Check-in
            </Button>
          )}
          {reservation.status === "IN_USE" && isOwner && (
            <Button
              size="small"
              color="primary"
              startIcon={<LogoutIcon />}
              onClick={handleCheckout}
            >
              Check-out
            </Button>
          )}
          {isStaff && (
            <Button
              size="small"
              color="warning"
              startIcon={<ReportProblemIcon />}
              onClick={() => onIncident(reservation)}
            >
              Incidente
            </Button>
          )}
          {reservation.type === "COMPOSITE_CHILD" && onManageComposite && (
            <Button
              size="small"
              color="secondary"
              variant="outlined"
              startIcon={<AccountTreeIcon />}
              onClick={() => onManageComposite(reservation)}
              sx={{ "&:active": { transform: "scale(0.97)" } }}
            >
              Cancelar item
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
