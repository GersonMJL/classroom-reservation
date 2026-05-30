import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg";
};

export function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = "Salvar",
  submitting,
  children,
  maxWidth = "sm",
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      disableEscapeKeyDown={submitting}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box component="span" sx={{ fontWeight: 700 }}>{title}</Box>
        <IconButton aria-label="Fechar" onClick={onClose} disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>{children}</DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        {onSubmit && (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
