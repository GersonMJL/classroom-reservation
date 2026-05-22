import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import InboxIcon from "@mui/icons-material/Inbox";

type Props = { title: string; description?: string; icon?: ReactNode; action?: ReactNode };

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, color: "text.secondary", textAlign: "center" }}>
      <Box sx={{ fontSize: 48, color: "text.disabled" }}>{icon ?? <InboxIcon fontSize="inherit" />}</Box>
      <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>{title}</Typography>
      {description && <Typography variant="body2" sx={{ maxWidth: 420 }}>{description}</Typography>}
      {action}
    </Stack>
  );
}
