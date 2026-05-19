# Plano de Implementação em Fases — Classroom Reservation

## Contexto

O sistema já tem os módulos base funcionando (auth, users, environments, resources, locations), mas o núcleo de negócio — o domínio de reservas e tudo que orbita em torno dele — ainda são stubs vazios. O objetivo é implementar os 9 casos de uso documentados em `docs/CASOS-DE-USO.md`, seguindo a arquitetura modular-domain definida em `.github/instructions/`.

---

## Diagnóstico do Estado Atual

### Backend — O que está completo:
- `auth` — login/JWT funcionando
- `users` — CRUD completo
- `environments` — CRUD completo com policy, restrictions, requirements
- `resources` — CRUD completo
- `locations` — somente leitura (sem POST/PUT/DELETE)

### Backend — Stubs (só `router.py` vazio + `models.py`):
- `reservations` — núcleo do domínio, sem nenhuma lógica
- `organizational_units` — sem CRUD
- `qualifications` — sem CRUD
- `governance` — sem CRUD (Penalty, Appeal)
- `operations` — sem CRUD (Checkin, Checkout, Incident)
- `audit` — sem CRUD (AuditLog, ReservationVersion)

### Frontend — O que está presente:
- Environments, Resources, Users, Login, Register, Home

### Frontend — O que falta:
- Reservas (calendário + lista)
- Aprovações
- Check-in / Check-out
- Governança (penalidades)
- Auditoria / histórico
- Unidades organizacionais e qualificações (admin)

### Gaps de Enum (`shared/enums.py` vs docs):
| Enum | No código | Falta |
|---|---|---|
| `ReservationStatus` | 9 valores | `PRE_BLOCKED`, `EXPIRED`; nomes divergem |
| `ApprovalStatus` | 3 valores | `REQUIRES_CHANGES`, `ESCALATED` |
| `CalendarBlockType` | 4 valores | `RECURRING_EVENT`, `BUFFER`, `CLOSURE` |
| `PenaltyType` | 3 valores (WARNING…) | Deve ser NO_SHOW, LATE_CANCELLATION, DAMAGE, MISUSE, OVERTIME, SAFETY_VIOLATION |
| `PenaltyStatus` | ausente | PENDING, APPLIED, WAIVED, UNDER_APPEAL, RESOLVED |
| `AppealStatus` | ausente | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED |
| `CheckinMethod` | ausente | MANUAL, QR_CODE, CARD_ACCESS, KEY_PICKUP, SENSOR_TRIGGERED |
| `ResourceCheckoutStatus` | ausente | CHECKED_OUT, RETURNED, OVERDUE, LOST |
| `AuditAction` | 6 valores parciais | Faltam APPROVE, REJECT, CANCEL, CHECKIN, CHECKOUT, ASSIGN_RESOURCE, REMOVE_RESOURCE |

---

## Fases de Implementação

---

### Fase 1 — Fundação (Enums + Módulos Auxiliares CRUD)

**Objetivo**: Nivelar a base antes de tocar no domínio de reservas.

#### 1.1 Alinhamento de Enums
- Arquivo: `backend/app/shared/enums.py`
- Sincronizar todos os enums com os valores canônicos dos docs
- Gerar migration Alembic para colunas que usam SAEnum (se necessário)
- Não alterar valores que já estão em uso em dados produtivos sem verificar

#### 1.2 Módulo `locations` — CRUD completo
- Arquivos: `backend/app/modules/locations/`
- Adicionar `POST`, `PUT`, `DELETE` em `router.py` e `service.py`
- Schemas: `LocationCreate`, `LocationUpdate`

#### 1.3 Módulo `organizational_units` — CRUD completo
- Arquivos: `backend/app/modules/organizational_units/`
- Criar `schemas.py`, `repository.py`, `service.py`, completar `router.py`
- Endpoints: `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`

#### 1.4 Módulo `qualifications` — CRUD completo
- Arquivos: `backend/app/modules/qualifications/`
- Criar `schemas.py`, `repository.py`, `service.py`, completar `router.py`
- Endpoints CRUD para `Qualification` e `UserQualification`

#### 1.5 Frontend — Páginas Admin
- Páginas simples de tabela/form para Unidades Organizacionais e Qualificações
- Seguir padrão de `environments.tsx` (hooks + dialog + table)

---

### Fase 2 — Núcleo de Reservas (UC03)

**Objetivo**: Implementar o domínio central — criação, edição e ciclo de vida de reservas.

#### 2.1 Schemas e Repositório
- `backend/app/modules/reservations/schemas.py`
  - `ReservationBase`, `ReservationCreate`, `ReservationUpdate`, `ReservationRead`
  - Schemas para `ReservationResource`, `ReservationSupport`
- `backend/app/modules/reservations/repository.py`
  - Queries por ambiente, período, solicitante, status

#### 2.2 State Machine
- `backend/app/modules/reservations/state_machine.py`
- Transições válidas por status (conforme diagrama de estados dos docs)
- Exceções tipadas para transições inválidas

#### 2.3 Conflict Checker
- `backend/app/modules/reservations/conflict_checker.py`
- Verificar sobreposição de horários por ambiente
- Verificar conflitos de recursos móveis
- Usar `SELECT ... FOR UPDATE` ou equivalente para evitar race condition

#### 2.4 Buffer Manager
- `backend/app/modules/reservations/buffer_manager.py`
- Criar `CalendarBlock` com type=BUFFER automaticamente ao aprovar reserva
- Ler `ReservationPolicy.buffer_before` / `buffer_after`

#### 2.5 Service e Router
- `backend/app/modules/reservations/service.py`
  - `create_reservation` — valida conflitos, cria, chama state machine
  - `update_reservation`, `cancel_reservation`
  - `list_reservations` (filtros: ambiente, período, status, solicitante)
- `backend/app/modules/reservations/router.py`
  - `GET /api/v1/reservas/` — listagem com filtros
  - `GET /api/v1/reservas/{id}` — detalhes
  - `POST /api/v1/reservas/` — criar
  - `PUT /api/v1/reservas/{id}` — editar
  - `POST /api/v1/reservas/{id}/cancelar` — cancelar

#### 2.6 Frontend — Página de Reservas
- `/reservas` — visualização em calendário (MUI `DateCalendar` ou grade semanal)
- Formulário de criação/edição em dialog
- Chips de status com cores por estado

---

### Fase 2.5 — Reservas Recorrentes e Compostas

**Objetivo**: Estender o núcleo de reservas com cenários complexos previstos nas regras de negócio 3.1–3.5 (RECURRING e COMPOSITE). Fase 2 entrega apenas `ReservationType.SIMPLE`.

#### 2.5.1 Tipo RECURRING
- Schema: aceitar `recurrence_rule` (RRULE iCalendar) em `ReservationCreate`
- `backend/app/modules/reservations/recurrence_expander.py`
  - Expande RRULE em instâncias filhas (`parent_reservation_id`)
  - Limite máximo de ocorrências por série
- `conflict_checker.py` valida cada slot da série
  - Falha parcial: retorna lista de slots conflitantes; cliente decide aceitar/abortar

#### 2.5.2 Tipo COMPOSITE
- Endpoints para `CompositeReservation` e `CompositeReservationItem`
- Service: cancelamento de item `critical=True` propaga revisão das demais (RN 3.4)
- Suporte a `COMPOSITE_PARENT` e `COMPOSITE_CHILD` na state machine

#### 2.5.3 Dependências entre reservas
- `ReservationDependency`: cancelamento de pré-requisito dispara revisão automática
- Endpoint `GET /api/v1/reservas/{id}/dependentes`

#### 2.5.4 Frontend
- Toggle no formulário: "Repetir reserva" → seletor de frequência (diária/semanal/mensal + intervalo + ocorrências)
- Visualização de série no calendário com indicador visual (linha contínua entre instâncias)
- Fluxo de cancelamento: opção entre cancelar instância única ou série inteira

---

### Fase 3 — Fluxo de Aprovação (UC04)

**Objetivo**: Implementar aprovação automática e manual conforme criticidade do ambiente.

#### 3.1 Lógica de Aprovação
- No `reservations/service.py`:
  - Ao criar reserva: se `Environment.criticality == COMMON` → auto-aprova (`APPROVED`)
  - Se `CONTROLLED` ou `RESTRICTED` → status `PENDING_APPROVAL` + cria `Approval` record
- `backend/app/modules/reservations/repository.py`
  - `get_pending_approvals_for_approver(approver_id)`

#### 3.2 Endpoints de Aprovação
- `GET /api/v1/aprovacoes/` — aprovações pendentes (filtrado por papel)
- `POST /api/v1/aprovacoes/{id}/aprovar`
- `POST /api/v1/aprovacoes/{id}/rejeitar`
- `POST /api/v1/aprovacoes/{id}/solicitar-revisao`

#### 3.3 Frontend — Página de Aprovações
- `/aprovacoes` — lista de pendentes com contexto da reserva
- Botões aprovar/rejeitar/solicitar revisão com campo de comentário

---

### Fase 4 — Operações de Uso (UC05 + UC06)

**Objetivo**: Check-in, check-out, no-show automático e gestão de recursos durante uso.

#### 4.1 Módulo `operations` — CRUD completo
- `schemas.py`, `repository.py`, `service.py`, `router.py`
- **Check-in**: `POST /api/v1/operacoes/checkin`
  - Valida tolerância de horário
  - Muda status da reserva para `IN_USE`
  - Registra método (MANUAL, QR_CODE, etc.)
- **Check-out**: `POST /api/v1/operacoes/checkout`
  - Muda status para `COMPLETED`
  - Dispara `buffer_manager` para BUFFER pós-reserva
- **No-show**: job periódico ou trigger na listagem
  - Se `APPROVED` e janela de check-in expirou → `NO_SHOW`
  - Dispara criação de Penalty automática
- **Incidents**: `POST /api/v1/operacoes/incidentes`

#### 4.2 Frontend — Views Operacionais
- Check-in/out: botão na página de reserva ativa
- Indicador visual de status em tempo real

---

### Fase 5 — Governança (UC08)

**Objetivo**: Penalidades automáticas e fluxo de apelação.

#### 5.1 Módulo `governance` — CRUD completo
- `schemas.py`, `repository.py`, `service.py`, `router.py`
- **Penalty**:
  - Criação automática por no-show (chamada do service de operations)
  - `GET /api/v1/governanca/penalidades/` — listar com filtros
  - `POST /api/v1/governanca/penalidades/{id}/aplicar`
  - `POST /api/v1/governanca/penalidades/{id}/dispensar`
- **Appeal**:
  - `POST /api/v1/governanca/apelacoes/` — submeter apelação
  - `POST /api/v1/governanca/apelacoes/{id}/revisar`
  - `POST /api/v1/governanca/apelacoes/{id}/resolver`

#### 5.2 Frontend — Página de Governança
- `/governanca` — lista de penalidades do usuário atual
- Admin: visão completa com filtros por tipo/status

---

### Fase 6 — Auditoria e Histórico (UC09)

**Objetivo**: Rastreabilidade completa de todas as ações do sistema.

#### 6.1 AuditService (cross-cutting)
- `backend/app/shared/audit_service.py`
- `log_action(entity_type, entity_id, action, user_id, before, after)`
- Chamado nos services que modificam dados (reservations, approval, operations, governance)

#### 6.2 Módulo `audit` — CRUD completo
- `schemas.py`, `repository.py`, `service.py`, `router.py`
- `GET /api/v1/auditoria/` — listagem com filtros (período, entidade, ação, usuário)
- `GET /api/v1/auditoria/reservas/{id}/versoes` — histórico de versões de uma reserva

#### 6.3 Frontend — Página de Auditoria
- `/auditoria` — tabela com filtros avançados (visível apenas para admin/manager)

---

## Arquivos Críticos por Fase

| Fase | Arquivos-chave |
|---|---|
| 1 | `backend/app/shared/enums.py`, `modules/locations/`, `modules/organizational_units/`, `modules/qualifications/` |
| 2 | `modules/reservations/state_machine.py`, `conflict_checker.py`, `buffer_manager.py`, `service.py`, `router.py` |
| 3 | `modules/reservations/service.py` (auto-approve), `modules/reservations/router.py` (approval endpoints) |
| 4 | `modules/operations/service.py`, `modules/operations/router.py` |
| 5 | `modules/governance/service.py`, `modules/governance/router.py` |
| 6 | `app/shared/audit_service.py`, `modules/audit/` |

## Verificação por Fase

- **Fase 1**: `uv run ruff check .` passa; endpoints auxiliares respondem via `/docs`
- **Fase 2**: Criar reserva, listar, cancelar via `/docs`; conflito retorna 409
- **Fase 2.5**: Criar reserva recorrente com RRULE; cancelamento parcial de série; composite parent/child
- **Fase 3**: Reserva em ambiente COMMON auto-aprova; CONTROLLED fica PENDING_APPROVAL
- **Fase 4**: Check-in muda status; check-out fecha ciclo; no-show detectado
- **Fase 5**: Penalty criada automaticamente em no-show; apelação flui até resolução
- **Fase 6**: Cada mutação gera registro em audit_log; histórico de versões visível

## Dependências entre Fases

```
Fase 1   ← prerequisito de tudo
Fase 2   ← prerequisito de Fase 2.5, 3, 4, 5
Fase 2.5 ← prerequisito opcional de Fase 3+ (pode ser adiada)
Fase 3   ← prerequisito de Fase 4 (checkout pode depender de status aprovado)
Fase 4   ← prerequisito de Fase 5 (no-show gera penalty)
Fase 6   ← pode ser implementada em paralelo com Fase 3+
```
