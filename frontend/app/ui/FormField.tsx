import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

type Props = Omit<TextFieldProps, "error" | "helperText"> & { helper?: string; error?: string };

export function FormField({ helper, error, ...props }: Props) {
  return (
    <TextField
      fullWidth
      margin="dense"
      InputLabelProps={{ shrink: true }}
      helperText={error || helper}
      error={Boolean(error)}
      {...props}
    />
  );
}
