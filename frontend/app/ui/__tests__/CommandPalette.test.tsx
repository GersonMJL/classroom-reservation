import { describe, expect, it } from "vitest";
import { filterCommands } from "../CommandPalette";

describe("filterCommands", () => {
  const all = [
    { label: "Reservas",   path: "/reservas"   },
    { label: "Ambientes",  path: "/environments" },
    { label: "Auditoria",  path: "/auditoria"  },
  ];

  it("retorna todos quando query vazia", () => {
    expect(filterCommands(all, "")).toHaveLength(3);
  });

  it("filtra case-insensitive por substring", () => {
    expect(filterCommands(all, "amb").map(c => c.label)).toEqual(["Ambientes"]);
  });

  it("normaliza acentos", () => {
    expect(filterCommands(all, "auditoria").map(c => c.label)).toEqual(["Auditoria"]);
    expect(filterCommands(all, "auditória").map(c => c.label)).toEqual(["Auditoria"]);
  });
});
