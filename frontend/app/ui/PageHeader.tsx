import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ mb: 3, alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 640 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
