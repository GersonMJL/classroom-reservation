import { describe, expect, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../useToast";

function Probe() {
  const toast = useToast();
  return <button onClick={() => toast.success("Salvo com sucesso")}>fire</button>;
}

describe("useToast", () => {
  it("exibe e remove toast após interação", async () => {
    render(<ToastProvider><Probe /></ToastProvider>);
    await act(async () => { screen.getByText("fire").click(); });
    expect(await screen.findByRole("status")).toHaveTextContent("Salvo com sucesso");
  });
});
