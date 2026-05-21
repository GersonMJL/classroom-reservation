import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  padded?: boolean;
};

export function PageSection({ title, description, children, padded = true }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{ p: padded ? { xs: 2, md: 3 } : 0, mb: 3, borderRadius: 2, overflow: "hidden" }}
    >
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>}
          {description && <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{description}</Typography>}
        </Box>
      )}
      {children}
    </Paper>
  );
}
