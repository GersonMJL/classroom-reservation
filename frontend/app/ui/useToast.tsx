import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";

type Severity = "success" | "error" | "warning" | "info";
type ToastApi = {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  warning: (msg: string) => void;
  info:    (msg: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; msg: string; severity: Severity }>({
    open: false, msg: "", severity: "info",
  });

  const show = useCallback((severity: Severity) => (msg: string) => {
    setState({ open: true, msg, severity });
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: show("success"),
    error:   show("error"),
    warning: show("warning"),
    info:    show("info"),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={() => setState((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        aria-live="polite"
        aria-atomic="true"
      >
        <Alert
          role="status"
          severity={state.severity}
          variant="filled"
          onClose={() => setState((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 280, boxShadow: 4 }}
        >
          {state.msg}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
