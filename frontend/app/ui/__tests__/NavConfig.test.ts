import { describe, expect, it } from "vitest";
import { filterNavForRoles } from "../NavConfig";

describe("filterNavForRoles", () => {
  it("retorna itens públicos para usuário sem roles", () => {
    const items = filterNavForRoles([], false);
    expect(items.every(i => !i.requiresAuth)).toBe(true);
  });

  it("inclui Usuários apenas para admin", () => {
    const usersForUser    = filterNavForRoles(["user"], true).find(i => i.path === "/users");
    const usersForAdmin   = filterNavForRoles(["admin"], true).find(i => i.path === "/users");
    expect(usersForUser).toBeUndefined();
    expect(usersForAdmin).toBeDefined();
  });

  it("Aprovações disponível para admin e manager mas não para technician", () => {
    expect(filterNavForRoles(["admin"],      true).some(i => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["manager"],    true).some(i => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["technician"], true).some(i => i.path === "/aprovacoes")).toBe(false);
  });
});
