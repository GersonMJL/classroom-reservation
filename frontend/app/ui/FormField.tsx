import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

type Props = Omit<TextFieldProps, "error" | "helperText"> & { helper?: string; error?: string };

export function FormField({ helper, error, slotProps: callerSlotProps, ...props }: Props) {
  return (
    <TextField
      fullWidth
      margin="dense"
      slotProps={{ inputLabel: { shrink: true }, ...(callerSlotProps ?? {}) }}
      helperText={error || helper}
      error={Boolean(error)}
      {...props}
    />
  );
}
