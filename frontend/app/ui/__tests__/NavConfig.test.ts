import { describe, expect, it } from "vitest";
import { filterNavForRoles } from "../NavConfig";

describe("filterNavForRoles", () => {
  it("retorna itens públicos para usuário não autenticado", () => {
    const items = filterNavForRoles([], false);
    expect(items.every((i) => !i.requiresAuth)).toBe(true);
  });

  it("permite ao Aluno (STUDENT) acessar apenas Reservas e Ambientes", () => {
    const studentItems = filterNavForRoles(["STUDENT"], true);
    const paths = studentItems.map((i) => i.path);

    expect(paths).toContain("/reservas");
    expect(paths).toContain("/environments");
    expect(paths).not.toContain("/aprovacoes");
    expect(paths).not.toContain("/auditoria");
    expect(paths).not.toContain("/penalidades");
    expect(paths).not.toContain("/bloqueios");
    expect(paths).not.toContain("/users");
  });

  it("inclui Usuários apenas para admin", () => {
    const usersForStudent = filterNavForRoles(["STUDENT"], true).find((i) => i.path === "/users");
    const usersForAdmin = filterNavForRoles(["ADMIN"], true).find((i) => i.path === "/users");
    expect(usersForStudent).toBeUndefined();
    expect(usersForAdmin).toBeDefined();
  });

  it("Aprovações disponível para ADMIN e MANAGER mas não para TECHNICIAN ou STUDENT", () => {
    expect(filterNavForRoles(["ADMIN"], true).some((i) => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["MANAGER"], true).some((i) => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["TECHNICIAN"], true).some((i) => i.path === "/aprovacoes")).toBe(false);
    expect(filterNavForRoles(["STUDENT"], true).some((i) => i.path === "/aprovacoes")).toBe(false);
  });
});
