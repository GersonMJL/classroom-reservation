import { Box, Card, CardContent, Grid, Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Stack spacing={1.5} data-testid="table-skeleton" sx={{ p: 2, width: "100%" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} variant="text" width={`${100 / columns}%`} height={30} />
        ))}
      </Stack>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={`row-${i}`} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Grid container spacing={3} data-testid="card-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={`card-skel-${i}`}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2, mb: 2 }} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Skeleton variant="rounded" width={80} height={36} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" width={80} height={36} sx={{ borderRadius: 2 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function FormSkeleton() {
  return (
    <Box data-testid="form-skeleton" sx={{ p: 2 }}>
      <Skeleton variant="text" width="50%" height={36} sx={{ mb: 3 }} />
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Skeleton variant="rounded" width={100} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: 2 }} />
        </Stack>
      </Stack>
    </Box>
  );
}

export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Grid container spacing={2} data-testid="metric-skeleton" sx={{ mb: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={`metric-skel-${i}`}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="70%" height={40} sx={{ my: 1 }} />
            <Skeleton variant="text" width="50%" height={16} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
