import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { ReactNode } from "react";
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
};

export function DataTable<T>({ columns, rows, loading, emptyTitle = "Nada por aqui", emptyDescription, emptyAction, getRowKey, onRowClick }: Props<T>) {
  if (loading) return <TableSkeleton />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <TableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} align={c.align ?? "left"} sx={{ width: c.width }}>
                {c.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowKey(row)}
              hover
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align ?? "left"}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
