# Funcionalidades Pendentes da Documentação Funcional — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as funcionalidades de `docs/OBJETIVO.md`, `docs/REQUISITOS.md` e `docs/CASOS-DE-USO.md` que ainda não existem no backend/frontend, fechando os requisitos RF05–RF10, RNF02–RNF03 e os casos de uso UC04–UC09.

**Architecture:** Mantém o padrão modular existente (`router → service → repository`) em `backend/app/modules/<modulo>/`. Novos serviços de aprovação, check-in/out, buffers, no-show, penalidades, appeals, incidentes, auditoria e calendar-blocks são acoplados aos módulos correspondentes (`reservations`, `governance`, `operations`, `audit`, `environments`). Frontend acompanha cada feature do backend com tela MUI usando os tokens já definidos em `frontend/app/root.tsx`.

**Tech Stack:** Python 3.14 / FastAPI / SQLAlchemy 2.0 / Alembic / Pydantic v2 / PostgreSQL 16 no backend; React 19 / React Router 7 / TypeScript / MUI v9 / TailwindCSS v4 / Vite no frontend; `uv` no backend; Docker Compose para orquestração.

**Modo de verificação:** O usuário optou por **não** introduzir testes automatizados nesta rodada. Cada task termina com **passos de verificação manual** (curl/Swagger em `http://localhost:8000/docs`, ou interação na UI em `http://localhost:3000`) e commit. Sempre que possível, valide pelo Swagger antes de tocar no frontend.

**Convenções obrigatórias:**
- Todo texto de UI em **pt-BR** com acentuação correta.
- Toda enum nova deve nascer em `backend/app/shared/enums.py` antes de ser usada num model (`SAEnum(TheEnum, name="...")`).
- Toda rota nova em `/api/v1/<slug-pt-br>` declarada no `router.py` do módulo (prefix + tags).
- Toda alteração de schema gera migration Alembic separada (`uv run alembic revision --autogenerate -m "..."` + revisão manual da migration antes do `upgrade`).
- Toda task termina com `git add <arquivos> && git commit -m "..."` separado — commits frequentes.
- `ruff check .` + `ruff format .` precisam passar antes de cada commit no backend.
- `npm run lint && npm run typecheck` precisam passar antes de cada commit no frontend.

---

## Mapa de arquivos (visão geral)

### Novos arquivos criados pelo plano

| Caminho | Responsabilidade |
|---|---|
| `backend/app/core/rbac.py` | Dependency `require_roles(...)` para RBAC |
| `backend/app/modules/reservations/approval_service.py` | Decisão automática + manual de aprovação |
| `backend/app/modules/reservations/checkin_service.py` | Check-in, check-out, transições IN_USE/COMPLETED |
| `backend/app/modules/reservations/noshow_job.py` | Job de no-show acionável por endpoint admin |
| `backend/app/modules/reservations/recurrence.py` | Expansão de RRULE para gerar reservas filhas |
| `backend/app/modules/reservations/composite_service.py` | Criação/cancelamento de reservas compostas |
| `backend/app/modules/environments/calendar_block_service.py` | CRUD CalendarBlock administrativo |
| `backend/app/modules/environments/calendar_block_repository.py` | Persistência CalendarBlock |
| `backend/app/modules/environments/calendar_block_router.py` | Endpoints `/api/v1/calendar-blocks` |
| `backend/app/modules/governance/penalty_service.py` | Aplicação automática + manual de penalidades |
| `backend/app/modules/governance/penalty_repository.py` | Persistência Penalty |
| `backend/app/modules/governance/appeal_service.py` | Submissão e resolução de appeals |
| `backend/app/modules/governance/schemas.py` | Pydantic Penalty/Appeal |
| `backend/app/modules/operations/incident_service.py` | Registro de incidentes |
| `backend/app/modules/operations/incident_repository.py` | Persistência Incident |
| `backend/app/modules/operations/schemas.py` | Pydantic Incident |
| `backend/app/modules/audit/audit_service.py` | Snapshot before/after e leitura de logs |
| `backend/app/modules/audit/audit_repository.py` | Persistência AuditRecord/ReservationVersion |
| `backend/app/modules/audit/schemas.py` | Pydantic AuditRecord/ReservationVersion |
| `frontend/app/routes/approvals.tsx` | Tela de aprovação administrativa |
| `frontend/app/routes/calendar-blocks.tsx` | Tela de bloqueios administrativos |
| `frontend/app/routes/penalties.tsx` | Tela de penalidades + appeals |
| `frontend/app/routes/incidents.tsx` | Tela de incidentes |
| `frontend/app/routes/audit.tsx` | Tela de auditoria |

### Arquivos existentes que serão modificados

| Caminho | Motivo |
|---|---|
| `backend/app/core/auth.py` | Expor `current_user_with_roles` para RBAC |
| `backend/app/modules/reservations/service.py` | Hook de aprovação automática; chamar buffer_manager; aceite de termo |
| `backend/app/modules/reservations/conflict_checker.py` | Resolver TODOs (qualificação, calendar-block, suporte) |
| `backend/app/modules/reservations/state_machine.py` | Garantir transições check-in/out já existem (revisão) |
| `backend/app/modules/reservations/schemas.py` | Liberar `RECURRING`/`COMPOSITE`; aceite de termo |
| `backend/app/modules/reservations/router.py` | Novos endpoints aprovação/check-in/check-out |
| `backend/app/modules/reservations/models.py` | Campo `terms_accepted_at`; campo `noshow_tolerance_min` |
| `backend/app/modules/environments/models.py` | Campo `noshow_tolerance_min` |
| `backend/app/modules/environments/router.py` | Plug do `calendar_block_router` |
| `backend/app/modules/governance/router.py` | Endpoints penalty/appeal |
| `backend/app/modules/governance/models.py` | Penalty: usar `SAEnum(PenaltyStatus/PenaltyType)`; Appeal: `SAEnum(AppealStatus)` |
| `backend/app/modules/operations/router.py` | Endpoint incidentes |
| `backend/app/modules/operations/models.py` | Incident: usar `SAEnum(IncidentSeverity)` |
| `backend/app/modules/audit/router.py` | Endpoints leitura de auditoria |
| `backend/app/modules/audit/models.py` | AuditRecord: usar `SAEnum(AuditAction)` |
| `backend/app/main.py` | Incluir routers novos |
| `backend/app/db/models.py` | Importar models de penalty/appeal/incident/audit já estão; manter |
| `frontend/app/services/api.ts` | Novos endpoints: approval, checkin, calendar-block, penalty, appeal, incident, audit |
| `frontend/app/routes/reservations.tsx` | Ações check-in/check-out; aceite de termo; recorrente/composta |
| `frontend/app/routes.ts` | Registrar novas rotas |
| `frontend/app/welcome/*` ou layout existente | Itens de menu das telas novas (manter coerência de menu) |

---

# Fase 1 — RBAC, Fluxo de Aprovação e Auditoria

**Entregável:** Administradores conseguem aprovar/rejeitar reservas pendentes pela UI; reservas em ambientes `COMMON` sem conflito são auto-aprovadas; toda mutação de reserva gera registro de auditoria visível em tela.

**Cobertura de spec:** RF05, RF10, RNF02, UC04 (fluxos principal + A1 + E1), UC09 (fluxo principal + A1).

---

### Task 1.1: RBAC — dependency `require_roles`

**Files:**
- Create: `backend/app/core/rbac.py`
- Modify: `backend/app/modules/reservations/router.py` (usar nos endpoints de aprovação)
- Reference: `backend/app/core/auth.py:14-53`, `backend/app/modules/users/models.py:48-78`

- [ ] **Passo 1: Criar `rbac.py`**

```python
# backend/app/core/rbac.py
from collections.abc import Iterable

from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.modules.users.models import User
from app.shared.enums import UserRole


def require_roles(*allowed: UserRole):
    """Dependency factory: exige que o usuário possua pelo menos um dos papéis."""
    allowed_codes = {role.value for role in allowed}

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        user_codes = {
            ur.role.code for ur in current_user.user_roles if ur.role is not None
        }
        if not (user_codes & allowed_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: papel insuficiente",
            )
        return current_user

    return _checker
```

- [ ] **Passo 2: Verificar manualmente**

```bash
docker compose up -d
# em outro terminal:
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=admin@example.com&password=admin" \
  -H "Content-Type: application/x-www-form-urlencoded" | jq -r .access_token)
# ainda não há endpoint protegido por require_roles; deixar a verificação para a Task 1.4
```

- [ ] **Passo 3: Commit**

```bash
git add backend/app/core/rbac.py
git commit -m "feat(rbac): dependency require_roles baseada em UserRole"
```

---

### Task 1.2: Auto-aprovação para ambientes `COMMON`

**Files:**
- Modify: `backend/app/modules/reservations/service.py` (método `create_reservation`)
- Modify: `backend/app/modules/reservations/state_machine.py` (verificar transição PENDING_APPROVAL→APPROVED já existe — sim, linha 17)

- [ ] **Passo 1: Alterar `create_reservation` para decidir o status inicial pela criticidade**

No `create_reservation` em `backend/app/modules/reservations/service.py:56`, substituir o status fixo `PENDING_APPROVAL` pelo cálculo abaixo (após a checagem de conflitos):

```python
from app.shared.enums import EnvironmentCriticality

# ... dentro de create_reservation, depois de _raise_if_conflicts(report):

initial_status = (
    ReservationStatus.APPROVED
    if environment.criticality == EnvironmentCriticality.COMMON
    and not environment.requires_approval
    else ReservationStatus.PENDING_APPROVAL
)
initial_reason = (
    "Auto-aprovada (ambiente comum, sem conflitos)"
    if initial_status is ReservationStatus.APPROVED
    else "Criação da reserva"
)

reservation = Reservation(
    environment_id=payload.environment_id,
    requester_id=payload.requester_id,
    responsible_id=payload.responsible_id,
    start_time=payload.start_time,
    end_time=payload.end_time,
    status=initial_status,
    type=ReservationType.SIMPLE,
    purpose=payload.purpose,
    participant_count=payload.participant_count,
)
reservation.resources = _build_resources(payload.resources)
reservation.support = _build_support(payload.support)
reservation.status_history = [
    _history_entry(
        previous=None,
        new=initial_status,
        user_id=current_user.id,
        reason=initial_reason,
    )
]
return self.repository.add(reservation)
```

- [ ] **Passo 2: Verificar via Swagger**

```bash
# crie um ambiente COMMON via POST /api/v1/environments com criticality="COMMON" e requires_approval=false
# crie uma reserva (POST /api/v1/reservas) usando esse ambiente
# o JSON de resposta deve ter "status": "APPROVED"
```

- [ ] **Passo 3: Commit**

```bash
git add backend/app/modules/reservations/service.py
git commit -m "feat(reservations): auto-aprovação para ambientes COMMON sem conflitos (RF05/UC04)"
```

---

### Task 1.3: Service de aprovação manual

**Files:**
- Create: `backend/app/modules/reservations/approval_service.py`
- Modify: `backend/app/modules/reservations/repository.py` (adicionar `list_pending`)

- [ ] **Passo 1: Adicionar `list_pending` no repository**

Em `backend/app/modules/reservations/repository.py`, adicionar dentro da classe:

```python
def list_pending(self, *, skip: int = 0, limit: int = 100) -> list[Reservation]:
    query = (
        select(Reservation)
        .options(*_eager_options())
        .where(Reservation.status == ReservationStatus.PENDING_APPROVAL)
        .order_by(Reservation.start_time)
        .offset(skip)
        .limit(limit)
    )
    return list(self.db.execute(query).scalars().unique().all())
```

- [ ] **Passo 2: Criar `approval_service.py`**

```python
# backend/app/modules/reservations/approval_service.py
from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.reservations import state_machine
from app.modules.reservations.models import Approval, Reservation, ReservationStatusHistory
from app.modules.reservations.repository import ReservationRepository
from app.modules.users.models import User
from app.shared.enums import ApprovalStatus, ReservationStatus


class ApprovalService:
    def __init__(self, repository: ReservationRepository) -> None:
        self.repository = repository

    def list_pending(self, *, skip: int = 0, limit: int = 100) -> list[Reservation]:
        return self.repository.list_pending(skip=skip, limit=limit)

    def approve(
        self, reservation: Reservation, approver: User, comments: str | None
    ) -> Reservation:
        return self._decide(
            reservation,
            approver,
            comments,
            target=ReservationStatus.APPROVED,
            approval_status=ApprovalStatus.APPROVED,
        )

    def reject(
        self, reservation: Reservation, approver: User, comments: str
    ) -> Reservation:
        if not comments or not comments.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Motivo obrigatório para rejeição",
            )
        return self._decide(
            reservation,
            approver,
            comments,
            target=ReservationStatus.REJECTED,
            approval_status=ApprovalStatus.REJECTED,
        )

    def _decide(
        self,
        reservation: Reservation,
        approver: User,
        comments: str | None,
        *,
        target: ReservationStatus,
        approval_status: ApprovalStatus,
    ) -> Reservation:
        current = ReservationStatus(reservation.status)
        try:
            state_machine.assert_transition(current, target)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc

        now = datetime.now(UTC)
        reservation.status = target
        reservation.approvals.append(
            Approval(
                approver_id=approver.id,
                status=approval_status,
                type="INITIAL",
                decision_date=now,
                comments=comments,
            )
        )
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=current,
                new_status=target,
                changed_at=now,
                reason=comments or f"{approval_status.value} por {approver.email}",
                user_id=approver.id,
            )
        )
        return self.repository.save(reservation)
```

- [ ] **Passo 3: `ruff check . && ruff format .`**

```bash
cd backend && uv run ruff check . && uv run ruff format .
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations/approval_service.py backend/app/modules/reservations/repository.py
git commit -m "feat(reservations): ApprovalService para aprovação/rejeição manual (UC04)"
```

---

### Task 1.4: Endpoints de aprovação e listagem de pendentes

**Files:**
- Modify: `backend/app/modules/reservations/router.py`
- Modify: `backend/app/modules/reservations/schemas.py` (adicionar `ReservationDecision`)

- [ ] **Passo 1: Schema de decisão**

Adicionar ao final de `backend/app/modules/reservations/schemas.py`:

```python
class ReservationDecision(BaseModel):
    comments: str | None = Field(default=None, max_length=1000)
```

- [ ] **Passo 2: Endpoints no router**

Em `backend/app/modules/reservations/router.py`, adicionar imports:

```python
from app.core.rbac import require_roles
from app.modules.reservations.approval_service import ApprovalService
from app.modules.reservations.schemas import ReservationDecision
from app.shared.enums import UserRole
```

Adicionar provider:

```python
def get_approval_service(db: Session = Depends(get_db)) -> ApprovalService:
    return ApprovalService(repository=ReservationRepository(db=db))
```

Adicionar endpoints:

```python
@router.get("/pendentes/lista", response_model=list[ReservationRead])
def list_pending(
    skip: int = 0,
    limit: int = 100,
    service: ApprovalService = Depends(get_approval_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> list[Any]:
    return service.list_pending(skip=skip, limit=limit)


@router.post("/{reservation_id}/aprovar", response_model=ReservationRead)
def approve_reservation(
    reservation_id: int,
    payload: ReservationDecision,
    service: ApprovalService = Depends(get_approval_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return service.approve(reservation, current_user, payload.comments)


@router.post("/{reservation_id}/rejeitar", response_model=ReservationRead)
def reject_reservation(
    reservation_id: int,
    payload: ReservationDecision,
    service: ApprovalService = Depends(get_approval_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    if not payload.comments or not payload.comments.strip():
        raise HTTPException(status_code=422, detail="Motivo obrigatório para rejeição")
    return service.reject(reservation, current_user, payload.comments)
```

- [ ] **Passo 3: Verificar via Swagger**

```bash
# Login como admin (papel ADMIN). Use POST /api/v1/reservas/{id}/aprovar com {"comments": "ok"}.
# Esperado: 200 e "status": "APPROVED". Login como REQUESTER → mesmo endpoint deve dar 403.
# GET /api/v1/reservas/pendentes/lista deve listar só reservas em PENDING_APPROVAL.
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations/router.py backend/app/modules/reservations/schemas.py
git commit -m "feat(reservations): endpoints aprovar/rejeitar e listar pendentes (UC04)"
```

---

### Task 1.5: Migration — Penalty/Appeal/Incident/AuditRecord usando `SAEnum`

**Files:**
- Modify: `backend/app/modules/governance/models.py`
- Modify: `backend/app/modules/operations/models.py`
- Modify: `backend/app/modules/audit/models.py`
- Create: `backend/alembic/versions/<timestamp>_enum_governance_audit.py`

- [ ] **Passo 1: Substituir colunas `String(64)` por `SAEnum(...)` nos models**

Em `backend/app/modules/governance/models.py`:
- `Penalty.type` → `SAEnum(PenaltyType, name="penalty_type")`
- `Penalty.status` → `SAEnum(PenaltyStatus, name="penalty_status")`
- `Appeal.status` → `SAEnum(AppealStatus, name="appeal_status")`

Em `backend/app/modules/operations/models.py`:
- `Incident.severity` → `SAEnum(IncidentSeverity, name="incident_severity")`

Em `backend/app/modules/audit/models.py`:
- `AuditRecord.action` → `SAEnum(AuditAction, name="audit_action")`

Adicionar os imports `from sqlalchemy import Enum as SAEnum` e `from app.shared.enums import ...` em cada arquivo.

- [ ] **Passo 2: Auditar dados existentes**

Antes de gerar a migration, conferir que nenhuma linha existente quebra os enums:

```bash
docker compose exec db psql -U postgres -d classroom -c "
  SELECT DISTINCT type, status FROM penalties;
  SELECT DISTINCT status FROM appeals;
  SELECT DISTINCT severity FROM incidents;
  SELECT DISTINCT action FROM audit_records;
"
```

Cada valor distinto precisa corresponder a um membro do enum em `backend/app/shared/enums.py`. Se houver divergência (ex.: valor legado em snake_case), inserir um `op.execute("UPDATE ... SET ... = '...'")` na migration **antes** do `op.alter_column`.

- [ ] **Passo 3: Gerar e revisar migration**

```bash
cd backend
uv run alembic revision --autogenerate -m "enum_governance_audit"
```

Abrir a migration gerada em `backend/alembic/versions/` e garantir que o `op.alter_column` cria os tipos enum via `postgresql.ENUM(..., create_type=True)` antes do alter — siga o padrão de `2026_05_13_2035-8c5c9cc89901_align_enums_phase1.py`.

- [ ] **Passo 4: Aplicar**

```bash
uv run alembic upgrade head
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/governance/models.py backend/app/modules/operations/models.py backend/app/modules/audit/models.py backend/alembic/versions/
git commit -m "refactor(enums): SAEnum em Penalty/Appeal/Incident/AuditRecord"
```

---

### Task 1.6: AuditService — repositório, schemas e snapshots automáticos

**Files:**
- Create: `backend/app/modules/audit/audit_repository.py`
- Create: `backend/app/modules/audit/audit_service.py`
- Create: `backend/app/modules/audit/schemas.py`
- Modify: `backend/app/modules/reservations/service.py` (chamar `audit.record(...)` em create/update/cancel; chamar em approval_service também)
- Modify: `backend/app/modules/reservations/approval_service.py` (chamar `audit.record(...)` em decisões)

- [ ] **Passo 1: Schemas Pydantic**

```python
# backend/app/modules/audit/schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.shared.enums import AuditAction


class AuditRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    target_id: int
    action: AuditAction
    performed_by: int
    performed_at: datetime
    before_state: str | None = None
    after_state: str | None = None
```

- [ ] **Passo 2: Repository**

```python
# backend/app/modules/audit/audit_repository.py
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditRecord
from app.shared.enums import AuditAction


class AuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        entity_type: str | None = None,
        target_id: int | None = None,
        action: AuditAction | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[AuditRecord]:
        query = select(AuditRecord)
        if entity_type:
            query = query.where(AuditRecord.entity_type == entity_type)
        if target_id is not None:
            query = query.where(AuditRecord.target_id == target_id)
        if action is not None:
            query = query.where(AuditRecord.action == action)
        if start is not None:
            query = query.where(AuditRecord.performed_at >= start)
        if end is not None:
            query = query.where(AuditRecord.performed_at <= end)
        query = query.order_by(AuditRecord.performed_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def add(self, record: AuditRecord) -> AuditRecord:
        self.db.add(record)
        self.db.flush()
        return record
```

- [ ] **Passo 3: Service com helper `record`**

```python
# backend/app/modules/audit/audit_service.py
import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.modules.audit.audit_repository import AuditRepository
from app.modules.audit.models import AuditRecord
from app.shared.enums import AuditAction


class AuditService:
    def __init__(self, repository: AuditRepository) -> None:
        self.repository = repository

    def list(self, **kwargs) -> list[AuditRecord]:
        return self.repository.list(**kwargs)

    def record(
        self,
        *,
        entity_type: str,
        target_id: int,
        action: AuditAction,
        performed_by: int,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
    ) -> AuditRecord:
        record = AuditRecord(
            entity_type=entity_type,
            target_id=target_id,
            action=action,
            performed_by=performed_by,
            performed_at=datetime.now(UTC),
            before_state=json.dumps(before, default=str)[:4000] if before else None,
            after_state=json.dumps(after, default=str)[:4000] if after else None,
        )
        return self.repository.add(record)


def build_audit_service(db: Session) -> AuditService:
    return AuditService(repository=AuditRepository(db=db))
```

- [ ] **Passo 4: Snapshot em `ReservationService` e `ApprovalService`**

Em `backend/app/modules/reservations/service.py`, importar `build_audit_service` e injetar no construtor:

```python
from app.modules.audit.audit_service import AuditService, build_audit_service

class ReservationService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit
```

Atualizar `get_reservation_service` em `router.py`:

```python
def get_reservation_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
    )
```

Adicionar helper privado em `service.py`:

```python
def _snapshot(reservation: Reservation) -> dict:
    return {
        "id": reservation.id,
        "status": reservation.status,
        "environment_id": reservation.environment_id,
        "start_time": reservation.start_time.isoformat() if reservation.start_time else None,
        "end_time": reservation.end_time.isoformat() if reservation.end_time else None,
        "participant_count": reservation.participant_count,
        "purpose": reservation.purpose,
        "resources": [r.resource_id for r in reservation.resources],
    }
```

Em `create_reservation`, depois de `self.repository.add(reservation)`:

```python
saved = self.repository.add(reservation)
self.audit.record(
    entity_type="reservation",
    target_id=saved.id,
    action=AuditAction.CREATE,
    performed_by=current_user.id,
    before=None,
    after=_snapshot(saved),
)
return saved
```

Em `update_reservation`, capturar `before = _snapshot(reservation)` antes das mutações e gravar `after` depois do `save`. Em `cancel_reservation`, idem com `action=AuditAction.CANCEL`.

Aplicar o mesmo padrão em `ApprovalService` (`action=AuditAction.APPROVE` / `REJECT`), injetando `AuditService` também no seu construtor e ajustando `get_approval_service` no router.

- [ ] **Passo 5: Verificar**

```bash
# Crie, atualize, cancele uma reserva. Depois:
# GET /api/v1/audit-records?entity_type=reservation&target_id=<id> deve listar os 3 eventos.
# (Endpoint da listagem é a próxima task.)
```

- [ ] **Passo 6: Commit**

```bash
git add backend/app/modules/audit backend/app/modules/reservations
git commit -m "feat(audit): snapshots automáticos de mutações de reserva (RF10/UC09)"
```

---

### Task 1.7: Router de auditoria

**Files:**
- Modify: `backend/app/modules/audit/router.py`

- [ ] **Passo 1: Substituir o stub pelo endpoint de leitura**

```python
# backend/app/modules/audit/router.py
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import AuditService, build_audit_service
from app.modules.audit.schemas import AuditRecordRead
from app.modules.users.models import User
from app.shared.enums import AuditAction, UserRole

router = APIRouter(prefix="/api/v1/audit-records", tags=["audit"])


def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    return build_audit_service(db)


@router.get("", response_model=list[AuditRecordRead])
def list_audit_records(
    skip: int = 0,
    limit: int = 100,
    entity_type: str | None = None,
    target_id: int | None = None,
    action: AuditAction | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    service: AuditService = Depends(get_audit_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> list[Any]:
    return service.list(
        skip=skip,
        limit=limit,
        entity_type=entity_type,
        target_id=target_id,
        action=action,
        start=start,
        end=end,
    )
```

- [ ] **Passo 2: Verificar via Swagger**

```bash
# GET /api/v1/audit-records (autenticado como ADMIN) deve retornar lista paginada.
# Filtros entity_type/target_id/action/start/end devem funcionar.
```

- [ ] **Passo 3: Commit**

```bash
git add backend/app/modules/audit/router.py
git commit -m "feat(audit): GET /api/v1/audit-records com filtros (UC09)"
```

---

### Task 1.8: Frontend — tela de aprovação administrativa

**Files:**
- Modify: `frontend/app/services/api.ts` (adicionar `reservationApi.listPending/approve/reject`)
- Create: `frontend/app/routes/approvals.tsx`
- Modify: `frontend/app/routes.ts` (registrar `/aprovacoes`)
- Modify: layout/menu para incluir item "Aprovações" (visível só se usuário tem role admin/manager — consultar `currentUser.roles`)

- [ ] **Passo 1: Estender `api.ts`**

Após o objeto `reservationApi` existente em `frontend/app/services/api.ts`, adicionar:

```ts
export interface ReservationDecisionInput {
  comments?: string;
}

reservationApi.listPending = async (skip = 0, limit = 100) => {
  const res = await fetch(
    `${API_BASE_URL}/reservas/pendentes/lista?skip=${skip}&limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Reservation[];
};

reservationApi.approve = async (id: number, comments?: string) => {
  const res = await fetch(`${API_BASE_URL}/reservas/${id}/aprovar`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ comments } satisfies ReservationDecisionInput),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Reservation;
};

reservationApi.reject = async (id: number, comments: string) => {
  const res = await fetch(`${API_BASE_URL}/reservas/${id}/rejeitar`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ comments }),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Reservation;
};
```

(Se `authHeaders`/`toError` ainda não existem como helpers exportados, extraí-los do `reservationApi` atual. Use o mesmo padrão de tratamento de `ReservationConflictError` se aplicável.)

- [ ] **Passo 2: Página `approvals.tsx`**

Layout em três partes (header → ações → tabela). Cada linha tem dois botões: **Aprovar** (abre dialog com campo opcional `comments`) e **Rejeitar** (abre dialog com campo obrigatório `comments`). Use `Paper`, `Table`, `Chip`, `Dialog` do MUI seguindo o padrão de `frontend/app/routes/reservations.tsx`.

Estado mínimo:
```ts
const [pending, setPending] = useState<Reservation[]>([]);
const [decisionTarget, setDecisionTarget] = useState<{ reservation: Reservation; kind: "approve" | "reject" } | null>(null);
const [comments, setComments] = useState("");
const [submitting, setSubmitting] = useState(false);
```

Animação de remoção de linha quando decisão é aplicada (fadeOut 200ms, respeitando `prefers-reduced-motion`, como em `reservations.tsx:507-516`).

- [ ] **Passo 3: Registrar rota**

```ts
// frontend/app/routes.ts
route("aprovacoes", "routes/approvals.tsx"),
```

- [ ] **Passo 4: Item de menu condicional**

Onde o menu de navegação é renderizado (verificar `frontend/app/welcome/` ou wrapper de layout existente em `root.tsx`), adicionar item "Aprovações" apontando para `/aprovacoes`. Renderizar apenas se `currentUser.roles` contém `"admin"` ou `"manager"`.

- [ ] **Passo 5: Verificar na UI**

```bash
cd frontend && npm run dev
# Login como admin → /aprovacoes carrega tabela. Aprove e rejeite uma reserva.
# Login como solicitante → item de menu "Aprovações" não aparece.
```

- [ ] **Passo 6: `npm run lint && npm run typecheck`**

- [ ] **Passo 7: Commit**

```bash
git add frontend/app/
git commit -m "feat(approvals): tela administrativa de aprovação de reservas (UC04)"
```

---

### Task 1.9: Frontend — tela de auditoria

**Files:**
- Modify: `frontend/app/services/api.ts` (`auditApi.list`)
- Create: `frontend/app/routes/audit.tsx`
- Modify: `frontend/app/routes.ts`

- [ ] **Passo 1: `auditApi` em `api.ts`**

```ts
export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "CANCEL"
  | "CHECKIN" | "CHECKOUT" | "ASSIGN_RESOURCE" | "REMOVE_RESOURCE";

export interface AuditRecord {
  id: number;
  entity_type: string;
  target_id: number;
  action: AuditAction;
  performed_by: number;
  performed_at: string;
  before_state: string | null;
  after_state: string | null;
}

export const auditApi = {
  list: async (filters: {
    entity_type?: string;
    target_id?: number;
    action?: AuditAction;
    start?: string;
    end?: string;
    skip?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    const res = await fetch(`${API_BASE_URL}/audit-records?${params}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as AuditRecord[];
  },
};
```

- [ ] **Passo 2: Página `audit.tsx`**

Layout: filtros (entity_type select, target_id input, action select, range de datas) → tabela cronológica decrescente. Linha selecionada abre `Dialog` com `before_state` e `after_state` renderizados em `<pre>` formatado (JSON.parse + JSON.stringify(..., null, 2)). Mostrar email do `performed_by` resolvendo via `userApi.getAllUsers` (cache local).

- [ ] **Passo 3: Registrar `/auditoria`** em `routes.ts` e adicionar ao menu (visível só para admin/manager).

- [ ] **Passo 4: Verificar**

```bash
# UI → /auditoria → criar+aprovar+cancelar uma reserva em outra aba → tabela deve refletir os 3 eventos.
```

- [ ] **Passo 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(audit): tela de auditoria com filtros e diff visual (UC09)"
```

---

# Fase 2 — Buffers automáticos, Check-in/Check-out, CalendarBlock administrativo

**Entregável:** Toda reserva aprovada gera buffers de pré/pós como `CalendarBlock(type=BUFFER)`; conflitos passam a considerar `CalendarBlock` (incluindo bloqueios administrativos, manutenção, fechamento); solicitantes fazem check-in/check-out pela UI; admin libera buffer antecipadamente; admin cria/edita/remove bloqueios pela UI.

**Cobertura de spec:** RF06, RF07, regras 2.2, 2.3, 2.5, 2.7, 9.1, 9.2, 9.5, 9.6, UC01 A2, UC05 fluxo principal, UC06.

---

### Task 2.1: Aplicar `buffer_manager` na aprovação

**Files:**
- Modify: `backend/app/modules/reservations/approval_service.py`
- Modify: `backend/app/modules/reservations/buffer_manager.py` (sem mudança no código; será chamado)

- [ ] **Passo 1: No `_decide`, após mutar status para `APPROVED`, criar buffers**

Em `approval_service.py`, dentro de `_decide`, depois de atualizar status para `APPROVED` e antes do `repository.save(...)`:

```python
from app.modules.environments.models import Environment
from app.modules.reservations import buffer_manager

# ...

if target is ReservationStatus.APPROVED:
    environment = self.repository.db.get(Environment, reservation.environment_id)
    buffer_manager.create_buffer_blocks(
        reservation=reservation,
        environment=environment,
        session=self.repository.db,
    )
```

Fazer o mesmo em `ReservationService.create_reservation` quando o status inicial for `APPROVED` (auto-aprovação da Task 1.2).

- [ ] **Passo 2: Verificar**

```bash
# Criar reserva em ambiente com buffer_before_min=15 e buffer_after_min=15 e criticality=COMMON.
# Verificar via Swagger GET de calendar-blocks (Task 2.4 cria endpoint) ou via SQL:
# SELECT * FROM calendar_blocks WHERE environment_id=... AND type='BUFFER';
# Devem existir 2 registros casando com start/end ± 15min.
```

- [ ] **Passo 3: Commit**

```bash
git add backend/app/modules/reservations/approval_service.py backend/app/modules/reservations/service.py
git commit -m "feat(buffers): gerar CalendarBlock BUFFER ao aprovar reserva (RF06/UC06)"
```

---

### Task 2.2: Conflict checker considera `CalendarBlock`

**Files:**
- Modify: `backend/app/modules/reservations/conflict_checker.py`
- Modify: `backend/app/modules/reservations/repository.py` (adicionar `get_calendar_blocks_overlapping`)

- [ ] **Passo 1: Repository — overlap de calendar blocks**

```python
# backend/app/modules/reservations/repository.py
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import CalendarBlockType

# dentro da classe:
def get_calendar_blocks_overlapping(
    self,
    *,
    environment_id: int,
    start: datetime,
    end: datetime,
    exclude_types: Iterable[CalendarBlockType] = (),
) -> list[CalendarBlock]:
    query = (
        select(CalendarBlock)
        .where(CalendarBlock.environment_id == environment_id)
        .where(CalendarBlock.start_time < end)
        .where(CalendarBlock.end_time > start)
    )
    excluded = list(exclude_types)
    if excluded:
        query = query.where(~CalendarBlock.type.in_(excluded))
    return list(self.db.execute(query).scalars().all())
```

- [ ] **Passo 2: `check_reservation` usa o novo método**

Em `backend/app/modules/reservations/conflict_checker.py`, remover o `# TODO Fase posterior: CalendarBlock` e adicionar:

```python
from app.shared.enums import CalendarBlockType

# dentro de check_reservation, antes do return:

blocks = repository.get_calendar_blocks_overlapping(
    environment_id=environment.id,
    start=start,
    end=end,
    exclude_types=(CalendarBlockType.BUFFER,),  # buffer da própria reserva ignorado em edição
)
for block in blocks:
    report.add(
        "CALENDAR_BLOCK",
        f"Bloqueio {block.type} de {block.start_time:%d/%m/%Y %H:%M} "
        f"a {block.end_time:%H:%M}",
    )
```

Nota: a exclusão de `BUFFER` evita que a edição de uma reserva colida com seus próprios buffers gerados; conflito real entre reservas distintas continua sendo capturado pelo `SCHEDULE`.

- [ ] **Passo 3: Verificar**

```bash
# Insira manualmente via Swagger (ou Task 2.4) um CalendarBlock CLOSURE no ambiente X.
# Tente criar reserva nesse ambiente sobrepondo o bloqueio → 409 com detalhe "CALENDAR_BLOCK".
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations/conflict_checker.py backend/app/modules/reservations/repository.py
git commit -m "feat(conflicts): considerar CalendarBlock em validação (regra 2.5/2.7)"
```

---

### Task 2.3: Schemas e repository de `CalendarBlock`

**Files:**
- Create: `backend/app/modules/environments/calendar_block_repository.py`
- Create: `backend/app/modules/environments/calendar_block_service.py`
- Modify: `backend/app/modules/environments/schemas.py` (adicionar `CalendarBlockCreate/Update/Read`)

- [ ] **Passo 1: Schemas**

Adicionar ao final de `backend/app/modules/environments/schemas.py`:

```python
from datetime import datetime

from app.shared.enums import CalendarBlockType


class CalendarBlockBase(BaseModel):
    environment_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    type: CalendarBlockType
    priority: str = Field(default="NORMAL", max_length=64)

    @model_validator(mode="after")
    def _validate_window(self) -> "CalendarBlockBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time deve ser maior que start_time")
        return self


class CalendarBlockCreate(CalendarBlockBase):
    pass


class CalendarBlockUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    type: CalendarBlockType | None = None
    priority: str | None = Field(default=None, max_length=64)


class CalendarBlockRead(CalendarBlockBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
```

(Adicionar imports faltantes — `model_validator`, `ConfigDict` — se ainda não existirem no arquivo.)

- [ ] **Passo 2: Repository**

```python
# backend/app/modules/environments/calendar_block_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.reservations.models import CalendarBlock


class CalendarBlockRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self, *, skip: int = 0, limit: int = 100, environment_id: int | None = None
    ) -> list[CalendarBlock]:
        query = select(CalendarBlock).order_by(CalendarBlock.start_time)
        if environment_id is not None:
            query = query.where(CalendarBlock.environment_id == environment_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get_by_id(self, id: int) -> CalendarBlock | None:
        return self.db.get(CalendarBlock, id)

    def add(self, block: CalendarBlock) -> CalendarBlock:
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block

    def save(self, block: CalendarBlock) -> CalendarBlock:
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block

    def delete(self, block: CalendarBlock) -> None:
        self.db.delete(block)
        self.db.commit()
```

- [ ] **Passo 3: Service**

```python
# backend/app/modules/environments/calendar_block_service.py
from fastapi import HTTPException, status

from app.modules.environments.calendar_block_repository import CalendarBlockRepository
from app.modules.environments.schemas import CalendarBlockCreate, CalendarBlockUpdate
from app.modules.reservations.models import CalendarBlock
from app.shared.enums import CalendarBlockType


class CalendarBlockService:
    SYSTEM_TYPES = {CalendarBlockType.BUFFER}

    def __init__(self, repository: CalendarBlockRepository) -> None:
        self.repository = repository

    def list(self, **kwargs) -> list[CalendarBlock]:
        return self.repository.list(**kwargs)

    def get(self, id: int) -> CalendarBlock | None:
        return self.repository.get_by_id(id)

    def create(self, payload: CalendarBlockCreate) -> CalendarBlock:
        self._reject_system_type(payload.type)
        block = CalendarBlock(**payload.model_dump())
        return self.repository.add(block)

    def update(self, block: CalendarBlock, payload: CalendarBlockUpdate) -> CalendarBlock:
        self._reject_system_type(CalendarBlockType(block.type))
        data = payload.model_dump(exclude_unset=True)
        if "type" in data:
            self._reject_system_type(data["type"])
        for key, value in data.items():
            setattr(block, key, value)
        return self.repository.save(block)

    def delete(self, block: CalendarBlock) -> None:
        self._reject_system_type(CalendarBlockType(block.type))
        self.repository.delete(block)

    def _reject_system_type(self, type_: CalendarBlockType) -> None:
        if type_ in self.SYSTEM_TYPES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bloqueios gerados pelo sistema (BUFFER) não podem ser editados manualmente (regra 2.2)",
            )
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/environments
git commit -m "feat(calendar-blocks): repository, service e schemas (regra 2.2/2.5)"
```

---

### Task 2.4: Router `/api/v1/calendar-blocks`

**Files:**
- Create: `backend/app/modules/environments/calendar_block_router.py`
- Modify: `backend/app/main.py` (incluir o router)

- [ ] **Passo 1: Router**

```python
# backend/app/modules/environments/calendar_block_router.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.environments.calendar_block_repository import CalendarBlockRepository
from app.modules.environments.calendar_block_service import CalendarBlockService
from app.modules.environments.schemas import (
    CalendarBlockCreate,
    CalendarBlockRead,
    CalendarBlockUpdate,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/calendar-blocks", tags=["calendar-blocks"])


def get_service(db: Session = Depends(get_db)) -> CalendarBlockService:
    return CalendarBlockService(repository=CalendarBlockRepository(db=db))


@router.get("", response_model=list[CalendarBlockRead])
def list_blocks(
    skip: int = 0,
    limit: int = 100,
    environment_id: int | None = None,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.REQUESTER)),
) -> list[Any]:
    return service.list(skip=skip, limit=limit, environment_id=environment_id)


@router.post("", response_model=CalendarBlockRead, status_code=status.HTTP_201_CREATED)
def create_block(
    payload: CalendarBlockCreate,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.create(payload)


@router.put("/{block_id}", response_model=CalendarBlockRead)
def update_block(
    block_id: int,
    payload: CalendarBlockUpdate,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    block = service.get(block_id)
    if block is None:
        raise HTTPException(status_code=404, detail="Bloqueio não encontrado")
    return service.update(block, payload)


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(
    block_id: int,
    service: CalendarBlockService = Depends(get_service),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> None:
    block = service.get(block_id)
    if block is None:
        raise HTTPException(status_code=404, detail="Bloqueio não encontrado")
    service.delete(block)
```

- [ ] **Passo 2: Plugar em `main.py`**

```python
from app.modules.environments.calendar_block_router import router as calendar_block_router
# ...
app.include_router(calendar_block_router)
```

- [ ] **Passo 3: Verificar**

```bash
# POST /api/v1/calendar-blocks com type="ADMIN_BLOCK" → 201.
# POST com type="BUFFER" → 403 (regra 2.2).
# PUT/DELETE em buffer existente (gerado por aprovação) → 403.
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/environments/calendar_block_router.py backend/app/main.py
git commit -m "feat(calendar-blocks): CRUD /api/v1/calendar-blocks (regra 2.5)"
```

---

### Task 2.5: Check-in / Check-out — service e endpoints

**Files:**
- Create: `backend/app/modules/reservations/checkin_service.py`
- Modify: `backend/app/modules/reservations/router.py`
- Modify: `backend/app/modules/reservations/state_machine.py` (revisar — transições já cobrem APPROVED→IN_USE e IN_USE→COMPLETED)

- [ ] **Passo 1: Service**

```python
# backend/app/modules/reservations/checkin_service.py
from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.modules.audit.audit_service import AuditService
from app.modules.reservations import state_machine
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.modules.reservations.repository import ReservationRepository
from app.modules.users.models import User
from app.shared.enums import AuditAction, ReservationStatus


class CheckinService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def checkin(self, reservation: Reservation, user: User) -> Reservation:
        self._require_self_or_responsible(reservation, user)
        self._transition(reservation, ReservationStatus.IN_USE, user, "Check-in realizado")
        reservation.checkin_at = datetime.now(UTC)
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CHECKIN,
            performed_by=user.id,
            after={"checkin_at": saved.checkin_at.isoformat()},
        )
        return saved

    def checkout(self, reservation: Reservation, user: User) -> Reservation:
        self._require_self_or_responsible(reservation, user)
        self._transition(reservation, ReservationStatus.COMPLETED, user, "Check-out realizado")
        reservation.checkout_at = datetime.now(UTC)
        saved = self.repository.save(reservation)
        self.audit.record(
            entity_type="reservation",
            target_id=saved.id,
            action=AuditAction.CHECKOUT,
            performed_by=user.id,
            after={"checkout_at": saved.checkout_at.isoformat()},
        )
        return saved

    def _transition(
        self,
        reservation: Reservation,
        target: ReservationStatus,
        user: User,
        reason: str,
    ) -> None:
        current = ReservationStatus(reservation.status)
        try:
            state_machine.assert_transition(current, target)
        except state_machine.InvalidTransitionError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc
        reservation.status = target
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=current,
                new_status=target,
                changed_at=datetime.now(UTC),
                reason=reason,
                user_id=user.id,
            )
        )

    def _require_self_or_responsible(self, reservation: Reservation, user: User) -> None:
        if user.id not in (reservation.requester_id, reservation.responsible_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas solicitante ou responsável podem fazer check-in/out",
            )
```

- [ ] **Passo 2: Endpoints no router**

Em `backend/app/modules/reservations/router.py`, adicionar:

```python
from app.modules.reservations.checkin_service import CheckinService

def get_checkin_service(db: Session = Depends(get_db)) -> CheckinService:
    return CheckinService(
        repository=ReservationRepository(db=db),
        audit=build_audit_service(db),
    )


@router.post("/{reservation_id}/checkin", response_model=ReservationRead)
def checkin_reservation(
    reservation_id: int,
    service: CheckinService = Depends(get_checkin_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return service.checkin(reservation, current_user)


@router.post("/{reservation_id}/checkout", response_model=ReservationRead)
def checkout_reservation(
    reservation_id: int,
    service: CheckinService = Depends(get_checkin_service),
    res_service: ReservationService = Depends(get_reservation_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    reservation = res_service.get_reservation(reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return service.checkout(reservation, current_user)
```

- [ ] **Passo 3: Verificar**

```bash
# Reserva APPROVED → POST /reservas/{id}/checkin → status=IN_USE, checkin_at preenchido.
# POST /reservas/{id}/checkout → status=COMPLETED, checkout_at preenchido.
# Tentar checkin sendo usuário diferente → 403.
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(reservations): endpoints de check-in/check-out (RF07/UC05)"
```

---

### Task 2.6: Liberação antecipada de buffer (admin/técnico)

**Files:**
- Modify: `backend/app/modules/reservations/buffer_manager.py` (adicionar `release_buffer_early`)
- Modify: `backend/app/modules/reservations/router.py`

- [ ] **Passo 1: Adicionar função em `buffer_manager.py`**

```python
# backend/app/modules/reservations/buffer_manager.py
from datetime import datetime

from app.modules.reservations.models import CalendarBlock, ExecutionBuffer


def release_buffer_early(
    *,
    buffer_block: CalendarBlock,
    session,
    released_by_user_id: int,
    notes: str | None,
) -> CalendarBlock:
    """Encurta o CalendarBlock BUFFER para o instante atual."""
    now = datetime.now(buffer_block.start_time.tzinfo)
    if now <= buffer_block.start_time:
        # ainda não começou; nada a fazer
        return buffer_block
    if now >= buffer_block.end_time:
        return buffer_block
    buffer_block.end_time = now
    session.flush()
    return buffer_block
```

- [ ] **Passo 2: Endpoint**

Em `backend/app/modules/environments/calendar_block_router.py`, adicionar:

```python
from app.modules.reservations import buffer_manager

@router.post("/{block_id}/liberar", response_model=CalendarBlockRead)
def release_block_early(
    block_id: int,
    service: CalendarBlockService = Depends(get_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)),
    db: Session = Depends(get_db),
) -> Any:
    from app.shared.enums import CalendarBlockType  # local para evitar ciclo
    block = service.get(block_id)
    if block is None:
        raise HTTPException(status_code=404, detail="Bloqueio não encontrado")
    if CalendarBlockType(block.type) is not CalendarBlockType.BUFFER:
        raise HTTPException(status_code=422, detail="Somente buffers podem ser liberados antecipadamente")
    buffer_manager.release_buffer_early(
        buffer_block=block,
        session=db,
        released_by_user_id=current_user.id,
        notes=None,
    )
    db.commit()
    db.refresh(block)
    return block
```

- [ ] **Passo 3: Verificar**

```bash
# Após uma aprovação que gerou BUFFER, POST /api/v1/calendar-blocks/{buffer_id}/liberar como técnico
# → end_time deve passar a ser ≈ "agora".
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations/buffer_manager.py backend/app/modules/environments/calendar_block_router.py
git commit -m "feat(buffers): liberação antecipada por técnico/admin (UC06 A1)"
```

---

### Task 2.7: Frontend — ações check-in/check-out

**Files:**
- Modify: `frontend/app/services/api.ts` (`reservationApi.checkin/checkout`)
- Modify: `frontend/app/routes/reservations.tsx` (adicionar botões na linha de reserva)

- [ ] **Passo 1: API**

```ts
reservationApi.checkin = async (id: number) => {
  const res = await fetch(`${API_BASE_URL}/reservas/${id}/checkin`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Reservation;
};
reservationApi.checkout = async (id: number) => {
  const res = await fetch(`${API_BASE_URL}/reservas/${id}/checkout`, {
    method: "POST", headers: authHeaders(),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Reservation;
};
```

- [ ] **Passo 2: Botões na UI**

Em `frontend/app/routes/reservations.tsx`, após os botões `Editar`/`Cancelar` (linha ~559), adicionar:

```tsx
{reservation.status === "APPROVED" && (
  <Button
    size="small"
    color="primary"
    onClick={async () => {
      const updated = await reservationApi.checkin(reservation.id);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSuccessMessage("Check-in registrado");
    }}
  >
    Check-in
  </Button>
)}
{reservation.status === "IN_USE" && (
  <Button
    size="small"
    color="primary"
    onClick={async () => {
      const updated = await reservationApi.checkout(reservation.id);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSuccessMessage("Check-out registrado");
    }}
  >
    Check-out
  </Button>
)}
```

Envolver o `await` em `try/catch` reusando `handleAuthError` para coerência com o restante da página.

- [ ] **Passo 3: Verificar na UI**

```bash
# Login como solicitante de uma reserva APPROVED → botão "Check-in" aparece e funciona.
# Após check-in → botão "Check-out" aparece.
```

- [ ] **Passo 4: Commit**

```bash
git add frontend/app/services/api.ts frontend/app/routes/reservations.tsx
git commit -m "feat(reservations): botões de check-in/check-out na UI (UC05)"
```

---

### Task 2.8: Frontend — tela de bloqueios administrativos

**Files:**
- Modify: `frontend/app/services/api.ts` (`calendarBlockApi`)
- Create: `frontend/app/routes/calendar-blocks.tsx`
- Modify: `frontend/app/routes.ts`

- [ ] **Passo 1: API**

```ts
export type CalendarBlockType =
  | "ADMIN_BLOCK" | "MAINTENANCE" | "RECURRING_EVENT" | "BUFFER" | "HOLIDAY" | "CLOSURE";

export interface CalendarBlock {
  id: number;
  environment_id: number;
  start_time: string;
  end_time: string;
  type: CalendarBlockType;
  priority: string;
}

export interface CalendarBlockInput {
  environment_id: number;
  start_time: string;
  end_time: string;
  type: CalendarBlockType;
  priority?: string;
}

export const calendarBlockApi = {
  list: async (environmentId?: number) => { /* ... GET /calendar-blocks?environment_id= */ },
  create: async (payload: CalendarBlockInput) => { /* POST */ },
  update: async (id: number, payload: Partial<CalendarBlockInput>) => { /* PUT */ },
  remove: async (id: number) => { /* DELETE */ },
  releaseEarly: async (id: number) => { /* POST /{id}/liberar */ },
};
```

(Implementar cada método seguindo o padrão de `reservationApi` — `fetch`, `authHeaders()`, `toError`.)

- [ ] **Passo 2: Página**

Tabela paginada com filtro por ambiente. CTA "Novo bloqueio" abre `Dialog` com campos: ambiente (Select), tipo (Select excluindo `BUFFER`), prioridade (Select: CRITICAL/HIGH/NORMAL/LOW), início/término (DateTimePicker). Linha de tipo `BUFFER` mostra botão "Liberar agora"; linhas demais mostram "Editar"/"Excluir".

Animação fadeUp consistente com `reservations.tsx`.

- [ ] **Passo 3: Rota + menu**

```ts
route("bloqueios", "routes/calendar-blocks.tsx"),
```

Item de menu "Bloqueios" visível só para admin/manager/technician.

- [ ] **Passo 4: Verificar**

```bash
# /bloqueios → criar ADMIN_BLOCK; tente criar reserva conflitante na outra aba → conflito CALENDAR_BLOCK exibido.
```

- [ ] **Passo 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(calendar-blocks): tela admin de bloqueios (regra 2.5/UC01 A2)"
```

---

# Fase 3 — Qualificações na validação, suporte e No-Show

**Entregável:** Reservas em ambientes que exigem qualificação são bloqueadas se o solicitante não atende; suporte indisponível mantém reserva como pendente; admin dispara job de no-show para janelas vencidas.

**Cobertura de spec:** RF08 (parcial — suporte), RF09, regras 6.1, 6.2, 7.2, 7.4, UC03 (E2 lead time já existe), UC05 (E1 no-show), UC04 (E1 suporte indisponível).

---

### Task 3.1: Validação de qualificação do solicitante

**Files:**
- Modify: `backend/app/modules/reservations/conflict_checker.py`
- Modify: `backend/app/modules/reservations/service.py` (passar `requester_id` ao conflict_checker)

- [ ] **Passo 1: Estender assinatura**

Em `conflict_checker.py`:

```python
from app.modules.environments.models import EnvironmentRequirement
from sqlalchemy import select

# alterar assinatura:
def check_reservation(
    *,
    repository: ReservationRepository,
    environment: Environment,
    start: datetime,
    end: datetime,
    participant_count: int,
    resource_ids: list[int],
    requester_id: int,                               # NOVO
    requester_role_ids: list[int] | None = None,
    exclude_id: int | None = None,
    now: datetime | None = None,
) -> ConflictReport:
    # ... código existente ...

    # remover o "# TODO Fase posterior: qualificações..." e adicionar:
    required_qual_ids = [r.qualification_id for r in environment.requirements]
    if required_qual_ids:
        from app.modules.qualifications.models import UserQualification

        held = repository.db.execute(
            select(UserQualification.qualification_id)
            .where(UserQualification.user_id == requester_id)
            .where(UserQualification.qualification_id.in_(required_qual_ids))
        ).scalars().all()
        missing = set(required_qual_ids) - set(held)
        if missing:
            report.add(
                "QUALIFICATION",
                f"Solicitante não possui qualificações exigidas: {sorted(missing)}",
            )

    # ... resto inalterado ...
```

- [ ] **Passo 2: Atualizar chamadas em `service.py`**

Em `ReservationService.create_reservation` e `update_reservation`, passar `requester_id=payload.requester_id` (ou `reservation.requester_id` no update) para `check_reservation(...)`.

- [ ] **Passo 3: Verificar**

```bash
# Crie um Environment com EnvironmentRequirement vinculado a uma Qualification X.
# Tente criar reserva como usuário que NÃO tem UserQualification para X → 409 com "QUALIFICATION".
# Atribua a qualificação ao usuário (POST /api/v1/qualifications/users) → reserva passa.
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(conflicts): validar EnvironmentRequirement contra UserQualification (regra 6.1/6.2)"
```

---

### Task 3.2: Validação de disponibilidade de suporte

**Files:**
- Modify: `backend/app/modules/reservations/conflict_checker.py`
- Modify: `backend/app/modules/reservations/service.py` (passar tipos de suporte)
- Modify: `backend/app/modules/reservations/repository.py` (helper `has_support_available`)

- [ ] **Passo 1: Repository helper**

```python
# backend/app/modules/reservations/repository.py
from app.modules.resources.models import TechnicianSchedule
from app.modules.users.models import UserRole as URM  # evite conflito com enum
from app.shared.enums import SupportType, UserRole

def has_technician_available(
    self,
    *,
    support_type: SupportType,
    start: datetime,
    end: datetime,
) -> bool:
    # Existe ao menos um técnico em escala dentro do intervalo. Mapeamento simples:
    # qualquer User com role TECHNICIAN cuja TechnicianSchedule cobre o intervalo.
    technician_role_code = UserRole.TECHNICIAN.value
    query = (
        select(TechnicianSchedule)
        .join(URM, URM.user_id == TechnicianSchedule.technician_id)
        .join(URM.role)
        .where(TechnicianSchedule.start_date <= start)
        .where(TechnicianSchedule.end_date >= end)
    )
    schedule = self.db.execute(query).scalars().first()
    return schedule is not None
```

Nota: `TechnicianSchedule` é o agendamento existente. Se preferir refinar por `support_type` mais tarde (adicionando coluna no model), abrir issue. Para esta task basta a checagem de presença de escala válida no intervalo.

- [ ] **Passo 2: Conflict checker**

```python
# conflict_checker.py
from app.shared.enums import SupportType

# alterar assinatura:
def check_reservation(
    ...,
    required_support: list[SupportType] | None = None,
    ...,
):
    # ... código existente ...

    # remover "# TODO ... suporte" e adicionar:
    for support_type in required_support or []:
        if not repository.has_technician_available(
            support_type=support_type, start=start, end=end
        ):
            report.add(
                "SUPPORT_UNAVAILABLE",
                f"Sem técnico disponível para {support_type.value}",
            )
```

- [ ] **Passo 3: Service passa `required_support`**

Em `service.create_reservation` e `update_reservation`:

```python
required_support = [s.support_type for s in payload.support]
report = conflict_checker.check_reservation(
    ...,
    required_support=required_support,
)
```

- [ ] **Passo 4: Regra 7.4 — manter PENDING quando só falta suporte**

No `service.create_reservation`, se o report tiver SOMENTE conflitos do tipo `SUPPORT_UNAVAILABLE` e o ambiente é `COMMON`, **não** auto-aprovar — forçar `PENDING_APPROVAL` com motivo "Aguardando confirmação de suporte". Ajustar `_raise_if_conflicts` para suportar essa exceção:

```python
def _raise_if_conflicts(report, *, soft_types: set[str] = frozenset()) -> None:
    hard_conflicts = [c for c in report.conflicts if c.type not in soft_types]
    if not hard_conflicts:
        return
    # ... mesmo raise atual, mas usando hard_conflicts ...
```

Chamar `_raise_if_conflicts(report, soft_types={"SUPPORT_UNAVAILABLE"})` e, se houver soft conflicts, forçar `initial_status = PENDING_APPROVAL` com motivo apropriado.

- [ ] **Passo 5: Verificar**

```bash
# Crie reserva exigindo support=[IT_SUPPORT] em intervalo sem técnicos escalados.
# Esperado: 201 com status=PENDING_APPROVAL e historico com motivo "Aguardando confirmação de suporte".
```

- [ ] **Passo 6: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(conflicts): validar disponibilidade de suporte; manter pendente sem técnico (RF08/regra 7.4)"
```

---

### Task 3.3: Job de no-show acionável

**Files:**
- Create: `backend/app/modules/reservations/noshow_job.py`
- Modify: `backend/app/modules/environments/models.py` (campo `noshow_tolerance_min`)
- Modify: `backend/app/modules/environments/schemas.py` (idem)
- Modify: `backend/app/modules/reservations/router.py` (endpoint admin)
- Create: migration Alembic para `noshow_tolerance_min`

- [ ] **Passo 1: Campo `noshow_tolerance_min` em Environment**

Em `backend/app/modules/environments/models.py`, dentro da classe `Environment`:

```python
noshow_tolerance_min: Mapped[int] = mapped_column(
    Integer, default=15, nullable=False, server_default="15"
)
```

Adicionar `noshow_tolerance_min: int = Field(default=15, ge=0)` nos schemas `EnvironmentBase` e `EnvironmentUpdate`.

```bash
cd backend
uv run alembic revision --autogenerate -m "environment_noshow_tolerance"
uv run alembic upgrade head
```

- [ ] **Passo 2: Job**

```python
# backend/app/modules/reservations/noshow_job.py
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.audit.audit_service import build_audit_service
from app.modules.environments.models import Environment
from app.modules.reservations.models import Reservation, ReservationStatusHistory
from app.shared.enums import AuditAction, ReservationStatus


def mark_noshows(db: Session, *, now: datetime | None = None) -> list[int]:
    """Marca como NO_SHOW reservas APPROVED cujo (start_time + tolerância) já passou
    sem check-in. Retorna ids alterados."""
    now = now or datetime.now(UTC)
    audit = build_audit_service(db)

    candidates = db.execute(
        select(Reservation, Environment)
        .join(Environment, Environment.id == Reservation.environment_id)
        .where(Reservation.status == ReservationStatus.APPROVED)
        .where(Reservation.checkin_at.is_(None))
    ).all()

    changed: list[int] = []
    for reservation, environment in candidates:
        deadline = reservation.start_time + timedelta(minutes=environment.noshow_tolerance_min)
        if now < deadline:
            continue
        reservation.status = ReservationStatus.NO_SHOW
        reservation.status_history.append(
            ReservationStatusHistory(
                previous_status=ReservationStatus.APPROVED,
                new_status=ReservationStatus.NO_SHOW,
                changed_at=now,
                reason="No-show automático: tolerância vencida sem check-in",
                user_id=reservation.requester_id,
            )
        )
        audit.record(
            entity_type="reservation",
            target_id=reservation.id,
            action=AuditAction.UPDATE,
            performed_by=reservation.requester_id,
            before={"status": "APPROVED"},
            after={"status": "NO_SHOW"},
        )
        changed.append(reservation.id)

    if changed:
        db.commit()
    return changed
```

- [ ] **Passo 3: Endpoint admin**

Em `backend/app/modules/reservations/router.py`:

```python
from app.modules.reservations.noshow_job import mark_noshows

@router.post("/jobs/no-show", response_model=dict)
def run_noshow_job(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> dict:
    return {"updated_ids": mark_noshows(db)}
```

- [ ] **Passo 4: Verificar**

```bash
# Crie reserva APPROVED com start_time há 1 hora e sem check-in.
# POST /api/v1/reservas/jobs/no-show (como admin) → resposta { updated_ids: [<id>] }.
# GET /api/v1/reservas/{id} → status="NO_SHOW".
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/environments backend/app/modules/reservations backend/alembic/versions/
git commit -m "feat(noshow): job manual para marcar no-show por tolerância (RF09/UC05 E1)"
```

---

### Task 3.4: Aceite de termo de responsabilidade

**Files:**
- Modify: `backend/app/modules/reservations/models.py` (campo `terms_accepted_at`)
- Modify: `backend/app/modules/reservations/schemas.py` (campo obrigatório `accept_terms: bool`)
- Modify: `backend/app/modules/reservations/service.py` (validar)
- Create: migration Alembic

- [ ] **Passo 1: Model**

Em `Reservation`:

```python
terms_accepted_at: Mapped[datetime | None] = mapped_column(
    DateTime(timezone=True), nullable=True
)
```

```bash
cd backend
uv run alembic revision --autogenerate -m "reservation_terms_accepted"
uv run alembic upgrade head
```

- [ ] **Passo 2: Schema**

```python
# em ReservationCreate
accept_terms: bool = Field(default=False)

@model_validator(mode="after")
def _require_terms(self) -> "ReservationCreate":
    if not self.accept_terms:
        raise ValueError("Aceite dos termos de responsabilidade é obrigatório (regra 6.4)")
    return self
```

- [ ] **Passo 3: Service preenche timestamp**

Em `create_reservation`:

```python
reservation.terms_accepted_at = datetime.now(UTC)
```

- [ ] **Passo 4: Frontend — checkbox**

Em `frontend/app/routes/reservations.tsx`, no `Dialog` de criação, adicionar checkbox antes do botão "Solicitar reserva":

```tsx
<FormControlLabel
  control={<Checkbox checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} />}
  label="Aceito os termos de responsabilidade pelo uso do ambiente."
/>
```

E enviar `accept_terms: form.acceptTerms` no payload. Bloquear submit se não marcado.

- [ ] **Passo 5: Verificar**

```bash
# UI → tentar criar sem marcar termo → bloqueio com mensagem clara.
# API → POST sem accept_terms=true → 422.
```

- [ ] **Passo 6: Commit**

```bash
git add backend/app/modules/reservations backend/alembic/versions/ frontend/app/
git commit -m "feat(reservations): aceite obrigatório de termo de responsabilidade (regra 6.4)"
```

---

# Fase 4 — Reservas Recorrentes e Compostas

**Entregável:** Solicitante cria uma série semanal (recorrência) com N reservas filhas; admin cria evento composto (mestra+filhas) e cancelamento parcial dispara revisão dos demais itens.

**Cobertura de spec:** RF04 (parte recorrente), regras 3.1–3.5, UC03 A1, UC07.

---

### Task 4.1: Expansão de recorrência semanal

**Files:**
- Create: `backend/app/modules/reservations/recurrence.py`
- Modify: `backend/app/modules/reservations/schemas.py` (liberar `RECURRING`, novo campo `recurrence`)
- Modify: `backend/app/modules/reservations/service.py`

- [ ] **Passo 1: Schema do payload recorrente**

Em `schemas.py`:

```python
class RecurrenceSpec(BaseModel):
    """Recorrência semanal simples: ocorrências e dias da semana (0=segunda)."""
    weekdays: list[int] = Field(min_length=1)
    occurrences: int = Field(gt=0, le=52)


class ReservationCreate(ReservationBase):
    resources: list[ReservationResourceCreate] = Field(default_factory=list)
    support: list[ReservationSupportCreate] = Field(default_factory=list)
    accept_terms: bool = Field(default=False)
    recurrence: RecurrenceSpec | None = None

    @model_validator(mode="after")
    def _validate_recurrence(self) -> "ReservationCreate":
        if self.recurrence and self.type is not ReservationType.RECURRING:
            raise ValueError("recurrence requer type=RECURRING")
        if self.type is ReservationType.RECURRING and self.recurrence is None:
            raise ValueError("type=RECURRING requer recurrence")
        return self
```

Remover do `ReservationBase` o `_validate_window_and_type` o trecho que rejeita não-SIMPLE; aceitar `SIMPLE` e `RECURRING` (deixar `COMPOSITE_*` para Task 4.3+).

- [ ] **Passo 2: Expansão de datas**

```python
# backend/app/modules/reservations/recurrence.py
from datetime import datetime, timedelta


def expand_weekly(
    start: datetime,
    end: datetime,
    *,
    weekdays: list[int],
    occurrences: int,
) -> list[tuple[datetime, datetime]]:
    duration = end - start
    out: list[tuple[datetime, datetime]] = []
    cursor = start
    safety = 0
    while len(out) < occurrences and safety < 365:
        if cursor.weekday() in weekdays:
            out.append((cursor, cursor + duration))
        cursor += timedelta(days=1)
        safety += 1
    return out
```

- [ ] **Passo 3: Service — criação recorrente**

Em `ReservationService.create_reservation`, antes do `if payload.type is not ReservationType.SIMPLE: raise`, substituir por:

```python
if payload.type is ReservationType.RECURRING:
    return self._create_recurring(payload, current_user)
if payload.type is not ReservationType.SIMPLE:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Tipo de reserva não suportado",
    )
# ... resto do create simples
```

E adicionar o método privado:

```python
from app.modules.reservations.recurrence import expand_weekly

def _create_recurring(self, payload: ReservationCreate, current_user: User) -> Reservation:
    environment = self.repository.db.get(Environment, payload.environment_id)
    if environment is None:
        raise HTTPException(status_code=404, detail="Ambiente não encontrado")

    slots = expand_weekly(
        payload.start_time,
        payload.end_time,
        weekdays=payload.recurrence.weekdays,
        occurrences=payload.recurrence.occurrences,
    )

    # Valida cada slot ANTES de inserir qualquer um — falha atômica
    resource_ids = [r.resource_id for r in payload.resources]
    for start, end in slots:
        report = conflict_checker.check_reservation(
            repository=self.repository,
            environment=environment,
            start=start,
            end=end,
            participant_count=payload.participant_count,
            resource_ids=resource_ids,
            requester_id=payload.requester_id,
            requester_role_ids=[ur.role_id for ur in current_user.user_roles],
        )
        _raise_if_conflicts(report)

    parent: Reservation | None = None
    initial_status = (
        ReservationStatus.APPROVED
        if environment.criticality == EnvironmentCriticality.COMMON
        and not environment.requires_approval
        else ReservationStatus.PENDING_APPROVAL
    )

    for idx, (start, end) in enumerate(slots):
        child = Reservation(
            parent_reservation_id=parent.id if parent else None,
            environment_id=payload.environment_id,
            requester_id=payload.requester_id,
            responsible_id=payload.responsible_id,
            start_time=start,
            end_time=end,
            status=initial_status,
            type=ReservationType.RECURRING,
            purpose=payload.purpose,
            participant_count=payload.participant_count,
            terms_accepted_at=datetime.now(UTC),
        )
        child.resources = _build_resources(payload.resources)
        child.support = _build_support(payload.support)
        child.status_history = [
            _history_entry(
                previous=None,
                new=initial_status,
                user_id=current_user.id,
                reason=f"Reserva recorrente {idx + 1}/{len(slots)}",
            )
        ]
        saved = self.repository.add(child)
        if parent is None:
            parent = saved
            # Re-parent: este é o pai; demais filhos apontam para ele
        else:
            # Garantir parent_reservation_id após primeiro save
            saved.parent_reservation_id = parent.id
            self.repository.save(saved)

    return parent
```

- [ ] **Passo 4: Verificar**

```bash
# POST /api/v1/reservas com type="RECURRING" e recurrence={weekdays:[1,3], occurrences:4}
# → resposta é a primeira reserva (pai). GET /api/v1/reservas?requester_id=X mostra 4 reservas.
# Se algum slot conflita, nenhuma reserva é criada.
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(reservations): recorrência semanal cria reservas filhas (RF04/UC03 A1)"
```

---

### Task 4.2: Service de reservas compostas

**Files:**
- Create: `backend/app/modules/reservations/composite_service.py`
- Modify: `backend/app/modules/reservations/schemas.py` (novo `CompositeReservationCreate`)
- Modify: `backend/app/modules/reservations/router.py` (endpoint)

- [ ] **Passo 1: Schema**

```python
class CompositeItemCreate(BaseModel):
    environment_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    participant_count: int = Field(ge=1)
    purpose: str = Field(min_length=1, max_length=128)
    resources: list[ReservationResourceCreate] = Field(default_factory=list)
    support: list[ReservationSupportCreate] = Field(default_factory=list)
    critical: bool = False


class CompositeReservationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    responsible_id: int = Field(gt=0)
    accept_terms: bool = Field(default=False)
    items: list[CompositeItemCreate] = Field(min_length=2)

    @model_validator(mode="after")
    def _require_terms(self) -> "CompositeReservationCreate":
        if not self.accept_terms:
            raise ValueError("Aceite dos termos é obrigatório")
        return self


class CompositeReservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    items: list[ReservationRead] = Field(default_factory=list)
```

- [ ] **Passo 2: Service**

```python
# backend/app/modules/reservations/composite_service.py
from datetime import UTC, datetime

from fastapi import HTTPException

from app.modules.audit.audit_service import AuditService
from app.modules.environments.models import Environment
from app.modules.reservations import conflict_checker
from app.modules.reservations.models import (
    CompositeReservation,
    CompositeReservationItem,
    Reservation,
    ReservationStatusHistory,
)
from app.modules.reservations.repository import ReservationRepository
from app.modules.reservations.schemas import CompositeReservationCreate
from app.modules.reservations.service import _build_resources, _build_support
from app.modules.users.models import User
from app.shared.enums import AuditAction, EnvironmentCriticality, ReservationStatus, ReservationType


class CompositeService:
    def __init__(self, repository: ReservationRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def create(
        self, payload: CompositeReservationCreate, current_user: User
    ) -> CompositeReservation:
        # Validar TODOS os itens antes de criar qualquer reserva (UC07 E2)
        envs: dict[int, Environment] = {}
        for item in payload.items:
            env = envs.get(item.environment_id) or self.repository.db.get(
                Environment, item.environment_id
            )
            if env is None:
                raise HTTPException(status_code=404, detail=f"Ambiente {item.environment_id} não encontrado")
            envs[item.environment_id] = env
            report = conflict_checker.check_reservation(
                repository=self.repository,
                environment=env,
                start=item.start_time,
                end=item.end_time,
                participant_count=item.participant_count,
                resource_ids=[r.resource_id for r in item.resources],
                requester_id=current_user.id,
                requester_role_ids=[ur.role_id for ur in current_user.user_roles],
                required_support=[s.support_type for s in item.support],
            )
            if report.has_conflicts:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "message": f"Conflito no item {item.environment_id}",
                        "conflicts": [{"type": c.type, "detail": c.detail} for c in report.conflicts],
                    },
                )

        composite = CompositeReservation(name=payload.name, description=payload.description)
        self.repository.db.add(composite)
        self.repository.db.flush()

        for idx, item in enumerate(payload.items):
            env = envs[item.environment_id]
            initial_status = (
                ReservationStatus.APPROVED
                if env.criticality == EnvironmentCriticality.COMMON and not env.requires_approval
                else ReservationStatus.PENDING_APPROVAL
            )
            reservation = Reservation(
                environment_id=item.environment_id,
                requester_id=current_user.id,
                responsible_id=payload.responsible_id,
                start_time=item.start_time,
                end_time=item.end_time,
                status=initial_status,
                type=ReservationType.COMPOSITE_CHILD,
                purpose=item.purpose,
                participant_count=item.participant_count,
                terms_accepted_at=datetime.now(UTC),
            )
            reservation.resources = _build_resources(item.resources)
            reservation.support = _build_support(item.support)
            reservation.status_history = [
                ReservationStatusHistory(
                    previous_status=None,
                    new_status=initial_status,
                    changed_at=datetime.now(UTC),
                    reason=f"Item composto {idx + 1}/{len(payload.items)} ({payload.name})",
                    user_id=current_user.id,
                )
            ]
            self.repository.db.add(reservation)
            self.repository.db.flush()
            composite.items.append(
                CompositeReservationItem(
                    reservation_id=reservation.id, critical=item.critical, order=idx
                )
            )

        self.repository.db.commit()
        self.repository.db.refresh(composite)
        self.audit.record(
            entity_type="composite_reservation",
            target_id=composite.id,
            action=AuditAction.CREATE,
            performed_by=current_user.id,
            after={"items": [i.reservation_id for i in composite.items]},
        )
        return composite
```

- [ ] **Passo 3: Router**

```python
# em backend/app/modules/reservations/router.py
from app.modules.reservations.composite_service import CompositeService
from app.modules.reservations.schemas import CompositeReservationCreate, CompositeReservationRead

def get_composite_service(db: Session = Depends(get_db)) -> CompositeService:
    return CompositeService(repository=ReservationRepository(db=db), audit=build_audit_service(db))


@router.post("/compostas", response_model=CompositeReservationRead, status_code=status.HTTP_201_CREATED)
def create_composite(
    payload: CompositeReservationCreate,
    service: CompositeService = Depends(get_composite_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.create(payload, current_user)


@router.get("/compostas/{composite_id}", response_model=CompositeReservationRead)
def get_composite(
    composite_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    from app.modules.reservations.models import CompositeReservation
    composite = db.get(CompositeReservation, composite_id)
    if composite is None:
        raise HTTPException(status_code=404, detail="Reserva composta não encontrada")
    # popular reservation por item para o response_model
    for item in composite.items:
        item.reservation  # touch
    return composite
```

Ajustar `CompositeReservationRead` para resolver as reservas dos `items` via `selectinload` se necessário (mais simples: retornar `items` com `reservation_id` apenas e expor um endpoint adicional `GET /reservas/compostas/{id}/itens` se quiser uma resposta plana).

- [ ] **Passo 4: Verificar**

```bash
# POST /api/v1/reservas/compostas com items=[{env A 14h-16h}, {env B 13h-17h}].
# Resposta: composite com 2 itens. Se um item conflita, NENHUM é criado (verifique via GET de cada env).
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(reservations): criação de reservas compostas atômicas (UC07)"
```

---

### Task 4.3: Cancelamento parcial e quebra de dependência

**Files:**
- Modify: `backend/app/modules/reservations/composite_service.py` (método `cancel_item`)
- Modify: `backend/app/modules/reservations/router.py` (endpoint)

- [ ] **Passo 1: Service**

```python
def cancel_item(
    self,
    composite_id: int,
    reservation_id: int,
    reason: str,
    current_user: User,
) -> CompositeReservation:
    composite = self.repository.db.get(CompositeReservation, composite_id)
    if composite is None:
        raise HTTPException(status_code=404, detail="Reserva composta não encontrada")

    target_item = next((i for i in composite.items if i.reservation_id == reservation_id), None)
    if target_item is None:
        raise HTTPException(status_code=404, detail="Item não pertence à reserva composta")

    target_res = self.repository.db.get(Reservation, reservation_id)

    # Cancela o item
    from app.modules.reservations import state_machine
    current = ReservationStatus(target_res.status)
    try:
        state_machine.assert_transition(current, ReservationStatus.CANCELLED)
    except state_machine.InvalidTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    target_res.status = ReservationStatus.CANCELLED
    target_res.status_history.append(
        ReservationStatusHistory(
            previous_status=current,
            new_status=ReservationStatus.CANCELLED,
            changed_at=datetime.now(UTC),
            reason=reason,
            user_id=current_user.id,
        )
    )

    # Se o item cancelado é crítico → demais ficam em PENDING_APPROVAL (revisão obrigatória)
    if target_item.critical:
        for item in composite.items:
            if item.reservation_id == reservation_id:
                continue
            other = self.repository.db.get(Reservation, item.reservation_id)
            if ReservationStatus(other.status) in (
                ReservationStatus.APPROVED, ReservationStatus.PENDING_APPROVAL
            ):
                prev = ReservationStatus(other.status)
                other.status = ReservationStatus.PENDING_APPROVAL
                other.status_history.append(
                    ReservationStatusHistory(
                        previous_status=prev,
                        new_status=ReservationStatus.PENDING_APPROVAL,
                        changed_at=datetime.now(UTC),
                        reason=f"Revisão obrigatória: item crítico #{reservation_id} cancelado",
                        user_id=current_user.id,
                    )
                )

    self.repository.db.commit()
    self.repository.db.refresh(composite)
    return composite
```

- [ ] **Passo 2: Endpoint**

```python
# router.py
@router.post("/compostas/{composite_id}/itens/{reservation_id}/cancelar", response_model=CompositeReservationRead)
def cancel_composite_item(
    composite_id: int,
    reservation_id: int,
    payload: ReservationCancel,
    service: CompositeService = Depends(get_composite_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.cancel_item(composite_id, reservation_id, payload.reason, current_user)
```

- [ ] **Passo 3: Verificar**

```bash
# Criar composta com 3 itens, marcar o item 2 como critical=true.
# Cancelar o item 2 → itens 1 e 3 voltam a PENDING_APPROVAL com motivo "Revisão obrigatória".
```

- [ ] **Passo 4: Commit**

```bash
git add backend/app/modules/reservations
git commit -m "feat(composite): cancelamento parcial dispara revisão em itens críticos (UC07 A1/E1)"
```

---

### Task 4.4: Frontend — fluxo recorrente e composta

**Files:**
- Modify: `frontend/app/services/api.ts` (`reservationApi.createRecurring`, `compositeApi.create`, `compositeApi.cancelItem`)
- Modify: `frontend/app/routes/reservations.tsx` (toggle "Recorrente" no dialog de nova reserva)
- Create: dialog adicional para "Nova reserva composta" acionado por menu de ações na página

- [ ] **Passo 1: API**

Estender `reservationApi.create` para aceitar `recurrence` opcional e `type: "RECURRING"`. Criar `compositeApi`:

```ts
export const compositeApi = {
  create: async (payload: {
    name: string;
    description?: string;
    responsible_id: number;
    accept_terms: boolean;
    items: Array<{
      environment_id: number;
      start_time: string;
      end_time: string;
      participant_count: number;
      purpose: string;
      resources: { resource_id: number }[];
      support: { support_type: string; responsible_staff_id?: number }[];
      critical: boolean;
    }>;
  }) => { /* POST /reservas/compostas */ },
  cancelItem: async (compositeId: number, reservationId: number, reason: string) => { /* POST */ },
};
```

- [ ] **Passo 2: UI recorrente**

No `Dialog` de "Nova reserva", após o campo `purpose`, adicionar `Switch` "Recorrência semanal". Quando ligado, mostrar:
- `ToggleButtonGroup` para selecionar dias da semana (0–6, labels "Seg", "Ter", …)
- `TextField` numérico "Ocorrências" (1–52)

No `handleSubmit`, se o switch estiver ligado, enviar `type: "RECURRING"` e `recurrence: { weekdays, occurrences }`.

- [ ] **Passo 3: UI composta**

Botão "Nova composta" no header da página de reservas. Abre `Dialog` com:
- Campos `name` e `description`
- Lista dinâmica de itens (botão "Adicionar item") onde cada item replica os campos de uma reserva simples (ambiente, início, término, finalidade, participantes, recursos) + checkbox "Item crítico"
- Checkbox de aceite de termos

Submit chama `compositeApi.create`. Após criar, recarregar lista.

- [ ] **Passo 4: Verificar**

```bash
# UI → criar reserva recorrente 4 ocorrências às segundas/quartas → calendário mostra 4 dias.
# UI → criar composta 3 itens (com 1 crítico) → todos aparecem; cancelar o crítico → outros voltam a "Pendente".
```

- [ ] **Passo 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(reservations): UI de recorrência semanal e reserva composta (RF04/UC07)"
```

---

# Fase 5 — Penalidades, Appeals e Incidentes

**Entregável:** Sistema aplica penalidade automática em no-show; admin registra incidente; solicitante submete recurso administrativo; bloqueio automático após 3 no-shows em 30 dias.

**Cobertura de spec:** regras 10.1–10.5, UC08 (fluxos principal, A1, A2, E1).

---

### Task 5.1: PenaltyService — repository, schemas e auto-aplicação em no-show

**Files:**
- Create: `backend/app/modules/governance/penalty_repository.py`
- Create: `backend/app/modules/governance/penalty_service.py`
- Create: `backend/app/modules/governance/schemas.py`
- Modify: `backend/app/modules/reservations/noshow_job.py` (chamar `PenaltyService.apply_no_show`)

- [ ] **Passo 1: Schemas**

```python
# backend/app/modules/governance/schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import AppealStatus, PenaltyStatus, PenaltyType


class PenaltyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    reservation_id: int
    type: PenaltyType
    status: PenaltyStatus
    description: str
    duration_days: int | None
    start_date: datetime | None
    end_date: datetime | None
    applied_by: int | None


class PenaltyManualCreate(BaseModel):
    user_id: int = Field(gt=0)
    reservation_id: int = Field(gt=0)
    type: PenaltyType
    description: str = Field(min_length=1, max_length=1000)
    duration_days: int | None = Field(default=None, ge=1, le=365)


class AppealCreate(BaseModel):
    penalty_id: int = Field(gt=0)
    justification: str = Field(min_length=1, max_length=1000)


class AppealResolve(BaseModel):
    approve: bool
    resolution_notes: str = Field(min_length=1, max_length=1000)


class AppealRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    penalty_id: int
    status: AppealStatus
    resolution_notes: str | None
```

- [ ] **Passo 2: Repository**

```python
# backend/app/modules/governance/penalty_repository.py
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.governance.models import Appeal, Penalty
from app.shared.enums import PenaltyStatus, PenaltyType


class PenaltyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self, *, skip: int = 0, limit: int = 100, user_id: int | None = None
    ) -> list[Penalty]:
        query = select(Penalty).order_by(Penalty.id.desc())
        if user_id is not None:
            query = query.where(Penalty.user_id == user_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def get(self, id: int) -> Penalty | None:
        return self.db.get(Penalty, id)

    def add(self, penalty: Penalty) -> Penalty:
        self.db.add(penalty)
        self.db.commit()
        self.db.refresh(penalty)
        return penalty

    def save(self, penalty: Penalty) -> Penalty:
        self.db.add(penalty)
        self.db.commit()
        self.db.refresh(penalty)
        return penalty

    def count_noshows_last_days(self, *, user_id: int, days: int, now: datetime) -> int:
        since = now - timedelta(days=days)
        query = (
            select(Penalty)
            .where(Penalty.user_id == user_id)
            .where(Penalty.type == PenaltyType.NO_SHOW)
            .where(Penalty.status.in_([PenaltyStatus.APPLIED, PenaltyStatus.PENDING]))
            .where(Penalty.start_date >= since)
        )
        return len(list(self.db.execute(query).scalars().all()))

    def get_appeal(self, id: int) -> Appeal | None:
        return self.db.get(Appeal, id)

    def add_appeal(self, appeal: Appeal) -> Appeal:
        self.db.add(appeal)
        self.db.commit()
        self.db.refresh(appeal)
        return appeal
```

- [ ] **Passo 3: Service**

```python
# backend/app/modules/governance/penalty_service.py
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException

from app.modules.audit.audit_service import AuditService
from app.modules.governance.models import Appeal, Penalty
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.users.models import User
from app.shared.enums import AppealStatus, AuditAction, PenaltyStatus, PenaltyType


class PenaltyService:
    NOSHOW_DURATION_DAYS = 7
    REPEAT_NOSHOW_THRESHOLD = 3
    REPEAT_NOSHOW_WINDOW_DAYS = 30
    REPEAT_BLOCK_DAYS = 30

    def __init__(self, repository: PenaltyRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, **kwargs) -> list[Penalty]:
        return self.repository.list(**kwargs)

    def apply_no_show(self, *, user_id: int, reservation_id: int) -> Penalty:
        now = datetime.now(UTC)
        penalty = Penalty(
            user_id=user_id,
            reservation_id=reservation_id,
            type=PenaltyType.NO_SHOW,
            status=PenaltyStatus.APPLIED,
            description="No-show automático",
            duration_days=self.NOSHOW_DURATION_DAYS,
            start_date=now,
            end_date=now + timedelta(days=self.NOSHOW_DURATION_DAYS),
            applied_by=None,
        )
        saved = self.repository.add(penalty)
        self.audit.record(
            entity_type="penalty",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=user_id,
            after={"type": "NO_SHOW", "user_id": user_id},
        )

        # E1: 3 no-shows em 30 dias → bloqueio adicional de 30 dias
        count = self.repository.count_noshows_last_days(
            user_id=user_id, days=self.REPEAT_NOSHOW_WINDOW_DAYS, now=now
        )
        if count >= self.REPEAT_NOSHOW_THRESHOLD:
            block = Penalty(
                user_id=user_id,
                reservation_id=reservation_id,
                type=PenaltyType.MISUSE,
                status=PenaltyStatus.APPLIED,
                description=f"Bloqueio por {self.REPEAT_NOSHOW_THRESHOLD} no-shows em "
                f"{self.REPEAT_NOSHOW_WINDOW_DAYS} dias",
                duration_days=self.REPEAT_BLOCK_DAYS,
                start_date=now,
                end_date=now + timedelta(days=self.REPEAT_BLOCK_DAYS),
                applied_by=None,
            )
            self.repository.add(block)

        return saved

    def apply_manual(
        self,
        *,
        user_id: int,
        reservation_id: int,
        type: PenaltyType,
        description: str,
        duration_days: int | None,
        applied_by: User,
    ) -> Penalty:
        now = datetime.now(UTC)
        penalty = Penalty(
            user_id=user_id,
            reservation_id=reservation_id,
            type=type,
            status=PenaltyStatus.APPLIED,
            description=description,
            duration_days=duration_days,
            start_date=now,
            end_date=now + timedelta(days=duration_days) if duration_days else None,
            applied_by=applied_by.id,
        )
        saved = self.repository.add(penalty)
        self.audit.record(
            entity_type="penalty",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=applied_by.id,
            after={"type": type.value, "user_id": user_id},
        )
        return saved

    def submit_appeal(self, *, penalty_id: int, justification: str, by: User) -> Appeal:
        penalty = self.repository.get(penalty_id)
        if penalty is None:
            raise HTTPException(status_code=404, detail="Penalidade não encontrada")
        if penalty.user_id != by.id:
            raise HTTPException(
                status_code=403, detail="Apenas o usuário penalizado pode recorrer"
            )
        penalty.status = PenaltyStatus.UNDER_APPEAL
        self.repository.save(penalty)
        appeal = Appeal(
            penalty_id=penalty_id,
            status=AppealStatus.SUBMITTED,
            resolution_notes=justification,
        )
        return self.repository.add_appeal(appeal)

    def resolve_appeal(
        self, *, appeal_id: int, approve: bool, resolution_notes: str, by: User
    ) -> Appeal:
        appeal = self.repository.get_appeal(appeal_id)
        if appeal is None:
            raise HTTPException(status_code=404, detail="Recurso não encontrado")
        appeal.status = AppealStatus.APPROVED if approve else AppealStatus.REJECTED
        appeal.resolution_notes = resolution_notes
        penalty = self.repository.get(appeal.penalty_id)
        penalty.status = PenaltyStatus.WAIVED if approve else PenaltyStatus.APPLIED
        self.repository.save(penalty)
        self.repository.db.add(appeal)
        self.repository.db.commit()
        self.repository.db.refresh(appeal)
        self.audit.record(
            entity_type="appeal",
            target_id=appeal_id,
            action=AuditAction.APPROVE if approve else AuditAction.REJECT,
            performed_by=by.id,
            after={"status": appeal.status},
        )
        return appeal
```

- [ ] **Passo 4: Integração com no-show job**

Em `backend/app/modules/reservations/noshow_job.py`, ao final de cada iteração que altera o status, importar e chamar:

```python
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService

penalty_service = PenaltyService(
    repository=PenaltyRepository(db=db),
    audit=audit,
)
# ... dentro do loop, após adicionar status_history e audit.record:
penalty_service.apply_no_show(
    user_id=reservation.requester_id,
    reservation_id=reservation.id,
)
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/governance backend/app/modules/reservations/noshow_job.py
git commit -m "feat(penalties): aplicação automática em no-show + bloqueio por recorrência (UC08/regra 10)"
```

---

### Task 5.2: Router de penalidades e appeals

**Files:**
- Modify: `backend/app/modules/governance/router.py`

- [ ] **Passo 1: Substituir o stub**

```python
# backend/app/modules/governance/router.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.governance.penalty_repository import PenaltyRepository
from app.modules.governance.penalty_service import PenaltyService
from app.modules.governance.schemas import (
    AppealCreate,
    AppealRead,
    AppealResolve,
    PenaltyManualCreate,
    PenaltyRead,
)
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/governance", tags=["governance"])


def get_penalty_service(db: Session = Depends(get_db)) -> PenaltyService:
    return PenaltyService(repository=PenaltyRepository(db=db), audit=build_audit_service(db))


@router.get("/penalidades", response_model=list[PenaltyRead])
def list_penalties(
    skip: int = 0,
    limit: int = 100,
    user_id: int | None = None,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(get_current_user),
) -> list[Any]:
    # solicitante só vê as próprias penalidades; admin/manager veem tudo
    is_staff = any(
        ur.role.code in (UserRole.ADMIN.value, UserRole.MANAGER.value)
        for ur in current_user.user_roles
        if ur.role
    )
    filter_user = user_id if is_staff else current_user.id
    return service.list(skip=skip, limit=limit, user_id=filter_user)


@router.post("/penalidades", response_model=PenaltyRead, status_code=201)
def create_penalty(
    payload: PenaltyManualCreate,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.apply_manual(
        user_id=payload.user_id,
        reservation_id=payload.reservation_id,
        type=payload.type,
        description=payload.description,
        duration_days=payload.duration_days,
        applied_by=current_user,
    )


@router.post("/appeals", response_model=AppealRead, status_code=201)
def submit_appeal(
    payload: AppealCreate,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(get_current_user),
) -> Any:
    return service.submit_appeal(
        penalty_id=payload.penalty_id, justification=payload.justification, by=current_user
    )


@router.post("/appeals/{appeal_id}/resolver", response_model=AppealRead)
def resolve_appeal(
    appeal_id: int,
    payload: AppealResolve,
    service: PenaltyService = Depends(get_penalty_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
) -> Any:
    return service.resolve_appeal(
        appeal_id=appeal_id,
        approve=payload.approve,
        resolution_notes=payload.resolution_notes,
        by=current_user,
    )
```

- [ ] **Passo 2: Verificar**

```bash
# 1) Disparar no-show (Task 3.3) → POST /api/v1/governance/penalidades retorna a auto-penalidade.
# 2) Como o próprio usuário penalizado → POST /api/v1/governance/appeals → status=SUBMITTED, penalty=UNDER_APPEAL.
# 3) Como admin → POST /api/v1/governance/appeals/{id}/resolver com approve=true → penalty=WAIVED.
```

- [ ] **Passo 3: Commit**

```bash
git add backend/app/modules/governance/router.py
git commit -m "feat(governance): endpoints de penalidades e appeals (UC08 A1/A2)"
```

---

### Task 5.3: Incident service e router

**Files:**
- Create: `backend/app/modules/operations/incident_repository.py`
- Create: `backend/app/modules/operations/incident_service.py`
- Create: `backend/app/modules/operations/schemas.py`
- Modify: `backend/app/modules/operations/router.py`

- [ ] **Passo 1: Schemas**

```python
# backend/app/modules/operations/schemas.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums import IncidentSeverity


class IncidentCreate(BaseModel):
    reservation_id: int = Field(gt=0)
    description: str = Field(min_length=1, max_length=1000)
    severity: IncidentSeverity


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reservation_id: int
    description: str
    severity: IncidentSeverity
    reported_at: datetime
```

- [ ] **Passo 2: Repository + Service**

```python
# backend/app/modules/operations/incident_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.operations.models import Incident


class IncidentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100, reservation_id: int | None = None) -> list[Incident]:
        query = select(Incident).order_by(Incident.reported_at.desc())
        if reservation_id is not None:
            query = query.where(Incident.reservation_id == reservation_id)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def add(self, incident: Incident) -> Incident:
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident
```

```python
# backend/app/modules/operations/incident_service.py
from datetime import UTC, datetime

from app.modules.audit.audit_service import AuditService
from app.modules.operations.incident_repository import IncidentRepository
from app.modules.operations.models import Incident
from app.modules.operations.schemas import IncidentCreate
from app.modules.users.models import User
from app.shared.enums import AuditAction


class IncidentService:
    def __init__(self, repository: IncidentRepository, audit: AuditService) -> None:
        self.repository = repository
        self.audit = audit

    def list(self, **kwargs) -> list[Incident]:
        return self.repository.list(**kwargs)

    def create(self, payload: IncidentCreate, reporter: User) -> Incident:
        incident = Incident(
            reservation_id=payload.reservation_id,
            description=payload.description,
            severity=payload.severity,
            reported_at=datetime.now(UTC),
        )
        saved = self.repository.add(incident)
        self.audit.record(
            entity_type="incident",
            target_id=saved.id,
            action=AuditAction.CREATE,
            performed_by=reporter.id,
            after={"reservation_id": saved.reservation_id, "severity": saved.severity},
        )
        return saved
```

- [ ] **Passo 3: Router**

```python
# backend/app/modules/operations/router.py
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.modules.audit.audit_service import build_audit_service
from app.modules.operations.incident_repository import IncidentRepository
from app.modules.operations.incident_service import IncidentService
from app.modules.operations.schemas import IncidentCreate, IncidentRead
from app.modules.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/operations", tags=["operations"])


def get_incident_service(db: Session = Depends(get_db)) -> IncidentService:
    return IncidentService(repository=IncidentRepository(db=db), audit=build_audit_service(db))


@router.get("/incidentes", response_model=list[IncidentRead])
def list_incidents(
    skip: int = 0,
    limit: int = 100,
    reservation_id: int | None = None,
    service: IncidentService = Depends(get_incident_service),
    _: User = Depends(get_current_user),
) -> list[Any]:
    return service.list(skip=skip, limit=limit, reservation_id=reservation_id)


@router.post("/incidentes", response_model=IncidentRead, status_code=201)
def create_incident(
    payload: IncidentCreate,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)),
) -> Any:
    return service.create(payload, current_user)
```

- [ ] **Passo 4: Verificar**

```bash
# POST /api/v1/operations/incidentes (como admin) → 201; lista via GET filtrando por reservation_id.
```

- [ ] **Passo 5: Commit**

```bash
git add backend/app/modules/operations
git commit -m "feat(operations): registro e leitura de incidentes (UC08 A1)"
```

---

### Task 5.4: Frontend — tela de penalidades e appeals

**Files:**
- Modify: `frontend/app/services/api.ts` (`penaltyApi`, `appealApi`)
- Create: `frontend/app/routes/penalties.tsx`
- Modify: `frontend/app/routes.ts`

- [ ] **Passo 1: API**

```ts
export const penaltyApi = {
  list: async (filters?: { user_id?: number }) => { /* GET /governance/penalidades */ },
  createManual: async (payload: {
    user_id: number; reservation_id: number; type: string; description: string; duration_days?: number;
  }) => { /* POST */ },
};
export const appealApi = {
  submit: async (penalty_id: number, justification: string) => { /* POST /governance/appeals */ },
  resolve: async (appealId: number, approve: boolean, resolution_notes: string) => { /* POST /resolver */ },
};
```

- [ ] **Passo 2: Página**

Layout: header → toggle "Minhas penalidades" (default para solicitante) vs "Todas" (admin/manager) → tabela com colunas `Usuário · Tipo · Status · Início · Fim · Ações`.

Ações por linha:
- Se `status=APPLIED` e penalidade é do usuário logado → botão "Recorrer" (dialog com `justification`).
- Se admin/manager → botão "Aplicar manual" no header (dialog com form completo).
- Se há appeal pendente e usuário é admin → botão "Resolver" (dialog: aprovar/rejeitar + `resolution_notes`).

- [ ] **Passo 3: Rota + menu**

```ts
route("penalidades", "routes/penalties.tsx"),
```

Item de menu "Penalidades" visível a todos os usuários (filtra automaticamente no backend).

- [ ] **Passo 4: Verificar**

```bash
# UI como solicitante penalizado → ver penalidade e recorrer.
# UI como admin → ver appeals pendentes e resolver.
```

- [ ] **Passo 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(penalties): tela de penalidades e appeals (UC08)"
```

---

### Task 5.5: Frontend — tela de incidentes

**Files:**
- Modify: `frontend/app/services/api.ts` (`incidentApi`)
- Create: `frontend/app/routes/incidents.tsx`
- Modify: `frontend/app/routes.ts`
- Modify: `frontend/app/routes/reservations.tsx` (botão "Registrar incidente" na linha de reserva, só para admin/manager/technician)

- [ ] **Passo 1: API**

```ts
export const incidentApi = {
  list: async (reservationId?: number) => { /* GET */ },
  create: async (payload: { reservation_id: number; description: string; severity: string }) => { /* POST */ },
};
```

- [ ] **Passo 2: Página**

Tabela cronológica com filtro por reserva. Botão "Novo incidente" no header. Dialog com `Select` de severity (LOW/MEDIUM/HIGH/CRITICAL), `Select` de reserva (autocomplete), `TextField` multiline para descrição.

- [ ] **Passo 3: Rota + atalho na linha de reserva**

Em `reservations.tsx`, adicionar botão "Incidente" na linha da reserva (visível só para admin/manager/technician) que abre o dialog pré-preenchido com `reservation_id`.

- [ ] **Passo 4: Verificar**

```bash
# UI como técnico → registrar incidente CRITICAL em uma reserva → aparece em /incidentes e em auditoria.
```

- [ ] **Passo 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(operations): tela de incidentes + atalho em reservas (UC08 A1)"
```

---

# Encerramento

Após concluir as 5 fases:

- [ ] **Verificação integrada (manual)**

Roteiro completo (~30 min) cobrindo a história ponta-a-ponta:

```text
1. Admin cria ambiente CONTROLLED com requires_approval=true, buffer 15/15min, noshow_tolerance_min=15.
2. Admin cria CalendarBlock ADMIN_BLOCK conflitante → bloqueia janela X.
3. Admin cria EnvironmentRequirement vinculado a uma Qualification.
4. Solicitante (sem qualificação) tenta reservar → 409 QUALIFICATION.
5. Admin atribui qualificação ao solicitante.
6. Solicitante cria reserva fora do ADMIN_BLOCK → status PENDING_APPROVAL.
7. Admin aprova → status APPROVED; buffers BUFFER aparecem em /bloqueios.
8. Outro solicitante tenta reservar dentro do BUFFER → 409 SCHEDULE.
9. Solicitante faz check-in → IN_USE.
10. Solicitante faz check-out → COMPLETED.
11. Admin libera o buffer pós antecipadamente → end_time encurta.
12. Em outra reserva APPROVED com start_time há 30min e sem check-in:
    - Admin POST /reservas/jobs/no-show → reserva vira NO_SHOW; penalidade NO_SHOW criada.
13. Solicitante submete appeal → penalidade UNDER_APPEAL.
14. Admin aprova appeal → penalidade WAIVED.
15. Admin registra Incident HIGH em uma reserva.
16. /auditoria mostra os eventos correspondentes a cada passo acima.
```

- [ ] **Commit final de docs (opcional)**

Se quiser registrar a conclusão, adicionar um pequeno changelog em `docs/CHANGELOG.md` listando as fases entregues.

---

## Observações finais

- **Sem testes automatizados nesta rodada** (opção do usuário). Recomendação para iteração futura: introduzir `backend/tests/` com pytest + `httpx.AsyncClient` + fixtures Alembic — começar pelos pontos de maior risco (conflict_checker, state_machine, penalty thresholds, recurrence expansion).
- **Notificações** (UC04 passo 6, UC05 E1 final, UC08 passo 4) ficam fora de escopo deste plano — exigem integração com canal externo (e-mail/Slack/WebPush). O auditoria + tela de aprovações dá visibilidade in-app suficiente para esta entrega.
- **Sensor/QR** (UC05 fluxo 9.2/9.3) também ficam fora — implementação atual cobre check-in MANUAL; mapeamento para `CheckinMethod` adicional pode ser feito estendendo o endpoint check-in com `?method=...`.
- **Composite update / dependências complexas** (UC07 com dependências encadeadas: A é pré-requisito de B) é coberto parcialmente: marcamos `critical=true` para disparar revisão, mas a estrutura `ReservationDependency` continua sem endpoints. Se for necessário, expor `POST /reservas/compostas/{id}/dependencias` em um sexto plano.
- **`alembic downgrade`** sempre disponível como rollback de cada migration; rode `uv run alembic downgrade -1` se uma migration nova quebrar o ambiente.
