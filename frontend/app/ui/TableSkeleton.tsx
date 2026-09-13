import { Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Stack spacing={1.5} data-testid="table-skeleton" sx={{ p: 2, width: "100%" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 0.5 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} variant="text" width={`${100 / columns}%`} height={28} />
        ))}
      </Stack>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={`row-${i}`} variant="rounded" height={44} sx={{ borderRadius: 1.5 }} />
      ))}
    </Stack>
  );
}
