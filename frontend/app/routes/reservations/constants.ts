import type { ChipProps } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import type { ReservationStatus } from "../../services/api";

export const STATUS_LABEL: Record<ReservationStatus, string> = {
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

export const STATUS_COLOR: Record<ReservationStatus, ChipProps["color"]> = {
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

export const EDITABLE_STATUSES: ReservationStatus[] = ["DRAFT", "PENDING_APPROVAL"];

export const CANCELLABLE_STATUSES: ReservationStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "PRE_BLOCKED",
  "APPROVED",
  "IN_USE",
];

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const MIN_TIME = dayjs().hour(7).minute(0).second(0);
export const MAX_TIME = dayjs().hour(22).minute(0).second(0);

// Coerces a Select's raw value into a valid positive id or "" (the empty sentinel).
// Number("") and Number(null) are 0; ids are always >= 1, so 0 maps to "".
export const toIdOrEmpty = (value: unknown): number | "" => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : "";
};

// Returns the picked date, or an explicitly invalid Dayjs when the field was cleared,
// so downstream validation (isValid) rejects an emptied picker instead of keeping stale state.
export const dateOrInvalid = (value: Dayjs | null): Dayjs => value ?? dayjs(NaN);
