import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "../DataTable";

const cols = [{ key: "name", header: "Nome", cell: (r: { name: string }) => r.name }];

describe("DataTable", () => {
  it("mostra skeleton quando loading=true", () => {
    render(<DataTable columns={cols} rows={[]} loading getRowKey={(r) => r.name} />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("mostra empty state quando vazio e sem loading", () => {
    render(<DataTable columns={cols} rows={[]} loading={false} emptyTitle="Vazio" emptyDescription="Sem dados" getRowKey={(r) => r.name} />);
    expect(screen.getByText("Vazio")).toBeInTheDocument();
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
  });

  it("renderiza linhas", () => {
    render(<DataTable columns={cols} rows={[{ name: "Sala A" }, { name: "Sala B" }]} loading={false} getRowKey={(r) => r.name} />);
    expect(screen.getByText("Sala A")).toBeInTheDocument();
    expect(screen.getByText("Sala B")).toBeInTheDocument();
  });
});
