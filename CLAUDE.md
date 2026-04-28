# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Extended instruction files

The `.github/instructions/` directory contains authoritative rule files that extend this CLAUDE.md. Consult them when working in the corresponding area:

| File | Scope |
|---|---|
| [backend-architecture-modular-domain.instructions.md](.github/instructions/backend-architecture-modular-domain.instructions.md) | `backend/**/*.py` |
| [domain-enum-standardization.instructions.md](.github/instructions/domain-enum-standardization.instructions.md) | `backend/**/*.py`, `frontend/app/**/*.{ts,tsx}` |
| [language-and-localization.instructions.md](.github/instructions/language-and-localization.instructions.md) | `**` |
| [frontend-design-system.instructions.md](.github/instructions/frontend-design-system.instructions.md) | `frontend/app/**/*.{ts,tsx,css}` |

## Agents & Skills

### Agent: Software Architect

[`.github/agents/cs-senior-engineer.md`](.github/agents/cs-senior-engineer.md) — Use when planning system design, writing ADRs, evaluating trade-offs, or designing bounded contexts.

### Skills

| Skill | Path | When to invoke |
|---|---|---|
| `senior-frontend` | [`.agents/skills/senior-frontend/`](.agents/skills/senior-frontend/) | React/TypeScript component patterns, bundle analysis, project scaffolding |
| `emil-design-eng` | [`.agents/skills/emil-design-eng/`](.agents/skills/emil-design-eng/) | UI polish, animation decisions, interaction quality review |

## Stack

- **Backend:** Python 3.14+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL 16
- **Frontend:** React 19, React Router 7, TypeScript, Material-UI v9, TailwindCSS v4, Vite
- **Package manager (backend):** `uv`
- **Orchestration:** Docker Compose

## Commands

### Full stack
```bash
docker compose up
# backend → http://localhost:8000   docs → http://localhost:8000/docs
# frontend → http://localhost:3000
```

### Backend (inside `backend/`)
```bash
uv run uvicorn app.main:app --reload
uv run ruff check .
uv run ruff format .
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### Frontend (inside `frontend/`)
```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Language conventions

- All assistant responses and documentation: **pt-BR**.
- User-facing UI text (labels, placeholders, validation messages, alerts): **pt-BR** with correct accentuation.
- Source code identifiers and developer-facing comments: English or pt-BR, following the conventions of the file being edited.

## Domain model (ER schema)

The full entity-relationship schema lives in [`.github/er-schema.md`](.github/er-schema.md). Consult it when:
- Implementing new domain models or relationships
- Writing Alembic migrations that span multiple tables
- Designing reservation domain features (availability, conflicts, approvals)

## Backend architecture

### Module layout

Each feature module lives under `backend/app/modules/<module>/` and follows a strict four-layer pattern:

```
router.py      → FastAPI APIRouter (prefix + tags declared here, not in main.py)
service.py     → Business logic; receives repository via constructor
repository.py  → SQLAlchemy queries only; receives Session via constructor
schemas.py     → Pydantic models (Base / Create / Update / Read)
models.py      → SQLAlchemy ORM models
```

Enforced flow: **HTTP Request → Router → Service → Repository → Database**

- Routers must not contain business logic or direct DB access.
- Services must not bypass repositories.
- Models must not contain domain workflow logic.

Modules with full CRUD: `environments`, `locations`, `resources`, `users`.  
Stub modules (models + empty router): `reservations`, `qualifications`, `governance`, `operations`, `audit`, `organizational_units`.

### Key conventions

- `backend/app/db/base.py` — `Base` provides `id: Mapped[int]` primary key to every ORM model.
- `backend/app/db/models.py` — central import list; Alembic reads this for autogenerate. Register new models here.
- `backend/app/shared/enums.py` — all `StrEnum` types. When adding an enum column, define the enum here first and use `SAEnum(TheEnum, name="the_enum")` in the model.
- Router prefix/tags are set on `APIRouter(prefix="...", tags=["..."])` inside each `router.py`; `main.py` calls `app.include_router(router)` with no extra arguments.
- All routes use `/api/v1/` with Portuguese slugs (e.g. `/api/v1/ambientes`, `/api/v1/reservas`).
- `get_db()` in `app.db.session` yields a `Session`; repositories receive it via `Depends(get_db)`.
- Cross-cutting concerns (config, logging, exceptions, utilities) go in `app/core/` or `app/shared/`.

### Authentication

- `POST /api/v1/auth/login` returns JWT access + refresh tokens.
- Protected endpoints use `_: Usuario = Depends(get_current_user)` from `app.core.auth`.
- Passwords hashed with Argon2 (`app.core.security`).

### Enum standardization

Every categorical field must use an explicit `StrEnum`; free-text categorical values are not allowed. Canonical values are defined in `backend/app/shared/enums.py`. Key domains:

| Domain | Field | Values |
|---|---|---|
| Reservation | status | DRAFT, PENDING_APPROVAL, PRE_BLOCKED, APPROVED, REJECTED, CANCELLED, IN_USE, COMPLETED, NO_SHOW, EXPIRED |
| Reservation | purpose | CLASS, MEETING, RESEARCH, EVENT, MAINTENANCE, TRAINING |
| Reservation | type | SIMPLE, RECURRING, COMPOSITE_PARENT, COMPOSITE_CHILD |
| Approval | status | PENDING, APPROVED, REJECTED, REQUIRES_CHANGES, ESCALATED |
| Environment | type | CLASSROOM, LABORATORY, AUDITORIUM, MEETING_ROOM, STUDIO, MULTIPURPOSE |
| Environment | criticality | COMMON, CONTROLLED, RESTRICTED |
| Environment restriction | type | TIME_WINDOW, PURPOSE_LIMITATION, CAPACITY_OVERRIDE, ACCESS_CONTROL, SAFETY_REQUIREMENT |
| Resource | type | EQUIPMENT, FURNITURE, SOFTWARE_LICENSE, KEY, SUPPLY, KIT |
| Resource checkout | status | CHECKED_OUT, RETURNED, OVERDUE, LOST |
| Calendar block | type | ADMIN_BLOCK, MAINTENANCE, RECURRING_EVENT, BUFFER, HOLIDAY, CLOSURE |
| Calendar block | priority | CRITICAL, HIGH, NORMAL, LOW |
| Checkin | method | MANUAL, QR_CODE, CARD_ACCESS, KEY_PICKUP, SENSOR_TRIGGERED |
| Incident | severity | LOW, MEDIUM, HIGH, CRITICAL |
| Reservation support | support_type | IT_SUPPORT, AUDIOVISUAL, LAB_TECHNICIAN, SECURITY, CLEANING |
| Penalty | type | NO_SHOW, LATE_CANCELLATION, DAMAGE, MISUSE, OVERTIME, SAFETY_VIOLATION |
| Penalty | status | PENDING, APPLIED, WAIVED, UNDER_APPEAL, RESOLVED |
| Appeal | status | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED |
| Audit log | action | CREATE, UPDATE, DELETE, APPROVE, REJECT, CANCEL, CHECKIN, CHECKOUT, ASSIGN_RESOURCE, REMOVE_RESOURCE |

Any enum change requires a schema migration, code update, and API versioning assessment. Never introduce values outside the defined enums; do not use fallback values like `OTHER` unless explicitly approved.

### Disallowed patterns

- Route handlers executing business workflows directly (no DB logic in routers).
- Direct `Session` usage in routers — only repositories touch the session.
- Business process logic inside ORM models.
- Scattered availability/conflict checks or duplicated state-transition rules.
- Free-text categorical fields (every finite-value field must use a `StrEnum`).

### Reservation domain specifics

Reservation is the core domain. When implementing it:
- Use a dedicated `state_machine.py` to enforce status transitions.
- Centralize availability/conflict logic in `conflict_checker.py` and `buffer_manager.py`.
- Do not scatter transition rules across the service layer.

## Frontend architecture

Routes are declared in `frontend/app/routes.ts` and components live in `frontend/app/routes/`. API calls are made from `frontend/app/services/`. The path alias `~/app/*` maps to `frontend/app/`.

### Design system

- Theme tokens and component overrides are defined in `frontend/app/root.tsx` — use existing tokens before adding per-component colors.
- Visual identity: earthy light palette, atmospheric background, rounded surfaces, expressive typography. Avoid plain white screens and default font stacks.
- Page layout pattern: header/context → primary actions → content surface (table/card/form).
- Prefer MUI components (`Paper`, `Button`, `Chip`, `Table`, `Dialog`) aligned with theme defaults.

### Motion and interaction

- Animations must have purpose; keep common UI animations under 300ms.
- Use transitions on specific properties only — never `transition: all`.
- Add subtle `:active` scale (~0.97) press feedback on interactive elements.
- Never animate entry from `scale(0)`; use `opacity` + `scale(0.95)` instead.
- Respect `prefers-reduced-motion`.

### UI change checklist

- UI text in pt-BR?
- Page coherent with existing screens?
- Interactions responsive (hover/press/loading/disabled)?
- Works on mobile and desktop?
