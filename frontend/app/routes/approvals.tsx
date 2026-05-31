import { useEffect, useMemo, useState } from "react";
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
  Paper,
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
  clearAuthTokens,
  environmentApi,
  hasValidAccessToken,
  reservationApi,
  userApi,
} from "../services/api";
import type {
  EnvironmentCriticality,
  Reservation,
  Room,
  User,
} from "../services/api";
import {
  CRITICALITY_COLOR,
  CRITICALITY_LABEL,
  CRITICALITY_RANK,
} from "./environments/constants";

export default function ApprovalsPage() {
  const navigate = useNavigate();

  const [pending, setPending] = useState<Reservation[]>([]);
  const [environments, setEnvironments] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [decisionTarget, setDecisionTarget] = useState<{
    reservation: Reservation;
    action: "approve" | "reject";
  } | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const loadPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await reservationApi.listPending(0, 100);
      setPending(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao listar reservas pendentes";
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
        const [envs, allUsers] = await Promise.all([
          environmentApi.getAllRooms(0, 500),
          userApi.getAllUsers(0, 500),
        ]);
        setEnvironments(envs);
        setUsers(allUsers);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados auxiliares";
        if (!handleAuthError(message)) setError(message);
      }
    };
    bootstrap();
    loadPending();
  }, [navigate]);

  const getEnvironmentName = (id: number): string =>
    environments.find((e) => e.id === id)?.name ?? `Ambiente #${id}`;

  const getUserName = (id: number): string =>
    users.find((u) => u.id === id)?.name ?? `Usuário #${id}`;

  const getEnvironmentCriticality = (
    id: number
  ): EnvironmentCriticality | null =>
    environments.find((e) => e.id === id)?.criticality ?? null;

  // Chip de criticidade; ambientes ainda não carregados (lookup nulo) mostram "—".
  const renderCriticalityChip = (id: number) => {
    const criticality = getEnvironmentCriticality(id);
    if (!criticality) {
      return <Chip label="—" size="small" variant="outlined" />;
    }
    return (
      <Chip
        label={CRITICALITY_LABEL[criticality]}
        color={CRITICALITY_COLOR[criticality]}
        size="small"
        variant={criticality === "RESTRICTED" ? "filled" : "outlined"}
      />
    );
  };

  // Reservas mais críticas primeiro (RESTRICTED → CONTROLLED → COMMON); desconhecidas ao final.
  const sortedPending = useMemo(() => {
    const rankOf = (environmentId: number): number => {
      const criticality = environments.find(
        (e) => e.id === environmentId
      )?.criticality;
      return criticality ? CRITICALITY_RANK[criticality] : 99;
    };
    return [...pending].sort(
      (a, b) => rankOf(a.environment_id) - rankOf(b.environment_id)
    );
  }, [pending, environments]);

  const openApprove = (reservation: Reservation) => {
    setDecisionTarget({ reservation, action: "approve" });
    setComments("");
  };

  const openReject = (reservation: Reservation) => {
    setDecisionTarget({ reservation, action: "reject" });
    setComments("");
  };

  const closeDialog = () => {
    if (submitting) return;
    setDecisionTarget(null);
    setComments("");
  };

  const handleDecision = async () => {
    if (!decisionTarget) return;
    const { reservation, action } = decisionTarget;

    if (action === "reject" && comments.trim().length === 0) {
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (action === "approve") {
        await reservationApi.approve(reservation.id, comments || undefined);
        setSuccessMessage("Reserva aprovada com sucesso.");
      } else {
        await reservationApi.reject(reservation.id, comments);
        setSuccessMessage("Reserva rejeitada.");
      }
      setPending((prev) => prev.filter((r) => r.id !== reservation.id));
      setDecisionTarget(null);
      setComments("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : action === "approve"
          ? "Falha ao aprovar reserva"
          : "Falha ao rejeitar reserva";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
            Aprovações
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Reservas aguardando decisão administrativa
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPending}
          disabled={loading}
          sx={{ borderColor: "rgba(31, 111, 95, 0.3)", color: "text.primary" }}
        >
          Atualizar
        </Button>
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

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : pending.length === 0 ? (
        <Alert severity="info">Nenhuma reserva pendente de aprovação.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quando</TableCell>
                  <TableCell>Ambiente</TableCell>
                  <TableCell>Criticidade</TableCell>
                  <TableCell>Solicitante</TableCell>
                  <TableCell>Finalidade</TableCell>
                  <TableCell>Participantes</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPending.map((r, index) => (
                  <TableRow
                    key={r.id}
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
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {dayjs(r.start_time).format("DD/MM/YYYY HH:mm")}
                      {" – "}
                      {dayjs(r.end_time).format("HH:mm")}
                    </TableCell>
                    <TableCell>{getEnvironmentName(r.environment_id)}</TableCell>
                    <TableCell>{renderCriticalityChip(r.environment_id)}</TableCell>
                    <TableCell>{getUserName(r.requester_id)}</TableCell>
                    <TableCell>{r.purpose}</TableCell>
                    <TableCell>{r.participant_count}</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => openApprove(r)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => openReject(r)}
                        >
                          Rejeitar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Decision Dialog */}
      <Dialog
        open={Boolean(decisionTarget)}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {decisionTarget?.action === "approve" ? "Aprovar reserva" : "Rejeitar reserva"}
        </DialogTitle>
        <DialogContent>
          {decisionTarget && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Ambiente:{" "}
                <strong>
                  {getEnvironmentName(decisionTarget.reservation.environment_id)}
                </strong>
                {" — "}
                {dayjs(decisionTarget.reservation.start_time).format(
                  "DD/MM/YYYY HH:mm"
                )}
                {" – "}
                {dayjs(decisionTarget.reservation.end_time).format("HH:mm")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Criticidade:
                </Typography>
                {renderCriticalityChip(decisionTarget.reservation.environment_id)}
              </Box>
              <TextField
                label={
                  decisionTarget.action === "reject"
                    ? "Motivo da rejeição *"
                    : "Comentários (opcional)"
                }
                multiline
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                required={decisionTarget.action === "reject"}
                error={
                  decisionTarget.action === "reject" && comments.trim().length === 0
                }
                helperText={
                  decisionTarget.action === "reject" && comments.trim().length === 0
                    ? "O motivo é obrigatório para rejeições."
                    : undefined
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={submitting} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={decisionTarget?.action === "approve" ? "primary" : "error"}
            onClick={handleDecision}
            disabled={
              submitting ||
              (decisionTarget?.action === "reject" && comments.trim().length === 0)
            }
          >
            {submitting
              ? "Aguarde..."
              : decisionTarget?.action === "approve"
              ? "Confirmar aprovação"
              : "Confirmar rejeição"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
