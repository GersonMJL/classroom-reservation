import { describe, it, expect } from "vitest";
import {
  CRITICALITY_LABEL,
  CRITICALITY_COLOR,
  CRITICALITY_RANK,
  formatCriticality,
} from "../constants";

describe("CRITICALITY_LABEL", () => {
  it("mapeia os três níveis canônicos para rótulos pt-BR", () => {
    expect(CRITICALITY_LABEL).toEqual({
      COMMON: "Comum",
      CONTROLLED: "Controlado",
      RESTRICTED: "Restrito",
    });
  });
});

describe("CRITICALITY_COLOR", () => {
  it("usa cores crescentes de severidade (sucesso → aviso → erro)", () => {
    expect(CRITICALITY_COLOR).toEqual({
      COMMON: "success",
      CONTROLLED: "warning",
      RESTRICTED: "error",
    });
  });
});

describe("CRITICALITY_RANK", () => {
  it("ordena do mais crítico (0) para o menos crítico", () => {
    expect(CRITICALITY_RANK.RESTRICTED).toBeLessThan(CRITICALITY_RANK.CONTROLLED);
    expect(CRITICALITY_RANK.CONTROLLED).toBeLessThan(CRITICALITY_RANK.COMMON);
  });
});

describe("formatCriticality", () => {
  it("mapeia um valor de enum conhecido para seu rótulo pt-BR", () => {
    expect(formatCriticality("RESTRICTED")).toBe("Restrito");
    expect(formatCriticality("COMMON")).toBe("Comum");
  });

  it("retorna a string crua para valores legados/desconhecidos", () => {
    expect(formatCriticality("LEGADO")).toBe("LEGADO");
    expect(formatCriticality("")).toBe("");
  });
});
