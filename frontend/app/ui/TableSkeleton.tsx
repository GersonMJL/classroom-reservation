import { Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={1.5} data-testid="table-skeleton" sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={44} />
      ))}
    </Stack>
  );
}
