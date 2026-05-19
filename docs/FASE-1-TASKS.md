# Tasks — Fase 1: Fundação

> Pré-requisito de todas as fases seguintes. Objetivo: nivelar enums, completar CRUD de módulos auxiliares e criar páginas admin no frontend.

---

## BACKEND

---

### TASK B1.1 — Alinhamento de Enums

**Descrição:** Sincronizar `backend/app/shared/enums.py` com os valores canônicos definidos nas instruções do projeto.

**Passo a passo:**

1. Substituir `ReservationStatus` — remover `AWAITING_CHECKIN`, `AWAITING_CHECKOUT`; adicionar `PRE_BLOCKED`, `EXPIRED`.
2. Substituir `ReservationType` — renomear `COMPOSITE` para `COMPOSITE_PARENT`; adicionar `COMPOSITE_CHILD`.
3. Substituir `ApprovalStatus` — adicionar `REQUIRES_CHANGES`, `ESCALATED`.
4. Substituir `CalendarBlockType` — renomear `EVENT` para `RECURRING_EVENT`; adicionar `BUFFER`, `CLOSURE`.
5. Substituir `PenaltyType` — remover `WARNING`, `SUSPENSION`, `BLOCK`; usar valores de domínio: `NO_SHOW`, `LATE_CANCELLATION`, `DAMAGE`, `MISUSE`, `OVERTIME`, `SAFETY_VIOLATION`.
6. Adicionar `PenaltyStatus` (ausente): `PENDING`, `APPLIED`, `WAIVED`, `UNDER_APPEAL`, `RESOLVED`.
7. Adicionar `AppealStatus` (ausente): `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`.
8. Adicionar `CheckinMethod` (ausente): `MANUAL`, `QR_CODE`, `CARD_ACCESS`, `KEY_PICKUP`, `SENSOR_TRIGGERED`.
9. Adicionar `ResourceCheckoutStatus` (ausente): `CHECKED_OUT`, `RETURNED`, `OVERDUE`, `LOST`.
10. Substituir `AuditAction` — adicionar `ASSIGN_RESOURCE`, `REMOVE_RESOURCE`.
11. Substituir `SupportType` — alinhar com o canônico: `IT_SUPPORT`, `AUDIOVISUAL`, `LAB_TECHNICIAN`, `SECURITY`, `CLEANING`.
12. Remover `AttachmentType` e `ResourceAttachment` — verificar uso em models antes de remover; migrar se necessário.
13. Fazer grep de todos os enums alterados nos `models.py` para identificar colunas `SAEnum` que precisam de migration.
14. Gerar e aplicar migration Alembic.
15. Verificar lint com `ruff check`.

---

### TASK B1.2 — Módulo `locations` — CRUD completo

**Descrição:** O módulo já tem `GET /` e `GET /{id}`. Faltam os endpoints de escrita com schemas, métodos de repositório e service. Seguir o padrão do módulo `environments`.

**Passo a passo:**

1. Adicionar schemas `LocationCreate` e `LocationUpdate` em `schemas.py`.
2. Adicionar métodos `create`, `update` e `delete` ao `repository.py`.
3. Adicionar métodos `create_location`, `update_location` e `delete_location` ao `service.py`.
4. Adicionar endpoints `POST /`, `PUT /{id}` e `DELETE /{id}` ao `router.py` com guard de autenticação.
5. Confirmar que o prefix do router usa o slug em português: `/api/v1/locais`.
6. Testar via `/docs` — criar, editar e deletar uma location.
7. Verificar lint com `ruff check`.

---

### TASK B1.3 — Módulo `organizational_units` — CRUD completo

**Descrição:** Módulo tem apenas `models.py` e `router.py` vazio. Criar todos os arquivos da camada seguindo o padrão `environments`.

**Passo a passo:**

1. Verificar em `.github/er-schema.md` se há enum para tipo de unidade organizacional; se sim, adicionar `OrganizationalUnitType` em `shared/enums.py`.
2. Criar `schemas.py` com `OrganizationalUnitBase`, `OrganizationalUnitCreate`, `OrganizationalUnitUpdate` e `OrganizationalUnitRead`.
3. Criar `repository.py` com `list`, `get_by_id`, `create`, `update` e `delete`.
4. Criar `service.py` com os métodos correspondentes.
5. Implementar `router.py` com CRUD completo, prefix `/api/v1/unidades-organizacionais` e guard de autenticação.
6. Registrar o router em `backend/app/main.py`.
7. Testar via `/docs` — CRUD completo.
8. Verificar lint com `ruff check`.

---

### TASK B1.4 — Módulo `qualifications` — CRUD completo

**Descrição:** Módulo tem apenas `models.py` e `router.py` vazio. O model tem duas entidades: `Qualification` e `UserQualification`. Implementar CRUD para ambas.

**Passo a passo:**

1. Criar `schemas.py` com schemas para `Qualification` (name, description) e `UserQualification` (user_id, qualification_id, valid_until).
2. Criar `repository.py` com dois repositórios: `QualificationRepository` e `UserQualificationRepository`.
3. Criar `service.py` com `QualificationService` unificando os dois repositórios.
4. Implementar `router.py` com endpoints para qualificações (`/api/v1/qualificacoes`) e atribuições a usuários (`/api/v1/qualificacoes/usuarios`).
5. Registrar o router em `backend/app/main.py`.
6. Testar via `/docs` — CRUD de qualificações e atribuição/revogação a usuários.
7. Verificar lint com `ruff check`.

---

### TASK B1.5 — Migration Alembic pós-enums

**Descrição:** Após alterar os enums em B1.1, verificar se algum model usa `SAEnum` com valores que mudaram e gerar a migration correspondente.

**Passo a passo:**

1. Identificar colunas com `SAEnum` alterados via grep em `backend/app/modules/` e `backend/app/shared/`.
2. Para cada enum alterado, verificar se há coluna no banco que usa esse tipo — `autogenerate` pode não detectar mudanças em valores de enum PostgreSQL.
3. Gerar migration com `alembic revision --autogenerate -m "sync enum values phase 1"`.
4. Revisar o arquivo gerado em `backend/alembic/versions/` — confirmar que os `ALTER TYPE` estão corretos.
5. Aplicar com `alembic upgrade head`.
6. Confirmar que `alembic current` aponta para a head.

---

## FRONTEND

---

### TASK F1.1 — Página de Unidades Organizacionais

**Descrição:** Criar página admin `/unidades-organizacionais` com tabela de listagem e dialog de criação/edição, seguindo o padrão de `environments.tsx`.

**Arquivos a criar:** `services/organizationalUnits.ts`, `routes/organizationalUnits.tsx`  
**Arquivos a editar:** `routes.ts`, navegação principal

**Passo a passo:**

1. Criar `services/organizationalUnits.ts` com funções para `list`, `create`, `update` e `delete` apontando para `/api/v1/unidades-organizacionais`.
2. Criar `routes/organizationalUnits.tsx` com hook de estado, tabela MUI (colunas: Nome, Tipo, Ações) e dialog de criação/edição.
3. Adicionar botão "Nova Unidade" e confirmação antes de deletar.
4. Adicionar rota em `routes.ts`.
5. Adicionar item de menu na navegação — visível apenas para `ADMIN`.
6. Todo texto da UI em pt-BR.
7. Verificar typecheck com `npm run typecheck`.
8. Testar no browser — criar, editar, deletar; confirmar que a tabela atualiza.

---

### TASK F1.2 — Página de Qualificações

**Descrição:** Criar página admin `/qualificacoes` com tabela de qualificações e dialog de criação/edição.

**Arquivos a criar:** `services/qualifications.ts`, `routes/qualifications.tsx`  
**Arquivos a editar:** `routes.ts`, navegação principal

**Passo a passo:**

1. Criar `services/qualifications.ts` com funções para `list`, `create`, `update` e `delete` apontando para `/api/v1/qualificacoes`.
2. Criar `routes/qualifications.tsx` com hook de estado, tabela MUI (colunas: Nome, Descrição, Ações) e dialog com campo descrição `multiline`.
3. Adicionar botão "Nova Qualificação".
4. Adicionar rota em `routes.ts` e item de menu na navegação admin.
5. Todo texto da UI em pt-BR.
6. Verificar typecheck com `npm run typecheck`.
7. Testar no browser — CRUD completo.

---

### TASK F1.3 — Atualizar slugs de rota no cliente API

**Descrição:** Verificar se algum service frontend usa prefixos em inglês que foram renomeados para português e alinhar.

**Passo a passo:**

1. Grep por `/api/v1/` em `frontend/app/services/` para listar todas as URLs usadas.
2. Para cada URL com slug em inglês, verificar o prefix atual do router backend e atualizar.
3. Verificar lint e typecheck após alterações.

---

## Critério de Conclusão da Fase 1

- [ ] `uv run ruff check .` passa sem erros
- [ ] `npm run typecheck` passa sem erros
- [ ] `uv run alembic current` aponta para a head correta
- [ ] Todos os novos enums estão em `shared/enums.py`
- [ ] `GET /api/v1/locais/`, `POST /api/v1/locais/`, `PUT /api/v1/locais/{id}`, `DELETE /api/v1/locais/{id}` respondem via `/docs`
- [ ] CRUD completo de `/api/v1/unidades-organizacionais/` responde via `/docs`
- [ ] CRUD completo de `/api/v1/qualificacoes/` responde via `/docs`
- [ ] Páginas `/unidades-organizacionais` e `/qualificacoes` funcionam no browser
- [ ] Todas as telas novas têm texto em pt-BR
