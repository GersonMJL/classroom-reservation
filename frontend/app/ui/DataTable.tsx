import { useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./TableSkeleton";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  paginated?: boolean;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  ariaLabel?: string;
};

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle = "Nada por aqui",
  emptyDescription,
  emptyAction,
  getRowKey,
  onRowClick,
  paginated = true,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100],
  ariaLabel = "Tabela de dados",
}: Props<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  if (loading) return <TableSkeleton rows={defaultRowsPerPage > 10 ? 10 : defaultRowsPerPage} columns={columns.length} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  const displayedRows = paginated
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <TableContainer sx={{ maxHeight: 650 }}>
        <Table size="medium" stickyHeader aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align ?? "left"}
                  sx={{
                    width: c.width,
                    fontWeight: 600,
                    bgcolor: "background.paper",
                    py: 1.5,
                  }}
                >
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row) => {
              const isClickable = Boolean(onRowClick);
              return (
                <TableRow
                  key={getRowKey(row)}
                  hover
                  tabIndex={isClickable ? 0 : undefined}
                  role={isClickable ? "button" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  sx={{
                    cursor: isClickable ? "pointer" : "default",
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: "-2px",
                    },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align ?? "left"} sx={{ py: 1.5 }}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {paginated && rows.length > rowsPerPageOptions[0] && (
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          />
        </Box>
      )}
    </Paper>
  );
}
