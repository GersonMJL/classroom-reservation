---
description: "Use when creating or refactoring backend domains, API routes, services, repositories, SQLAlchemy models, Pydantic schemas, or Alembic-integrated persistence flows. Enforces modular domain-oriented backend architecture boundaries."
applyTo: "backend/**/*.py"
---
# Backend Modular Domain Architecture

## Objective
- Keep backend changes aligned with ADR 001: modular, domain-oriented architecture with strict layer boundaries.

## Technology Baseline
- FastAPI for HTTP/API.
- SQLAlchemy for ORM and persistence.
- Pydantic for validation and serialization.
- Alembic for schema migration management.

## Target Architecture
- Organize backend by domain modules that encapsulate their own API, business logic, and persistence integration.
- Enforce this architecture for all touched backend files; do not add or keep violations in modified code.
- Preferred high-level structure:
  - app/main.py
  - app/core/
  - app/db/
  - app/modules/
  - app/shared/
  - app/tests/

## Domain Module Shape
- Each domain should be self-contained and typically include:
  - models.py
  - schemas.py
  - repository.py
  - service.py
  - router.py
- Add specialized components when needed (for example state machine, validators, conflict checkers).

## Layer Responsibilities

### Router Layer
- Define endpoints and map HTTP request/response payloads.
- Delegate all business decisions to service layer.
- Do not perform direct database access.
- If a router currently talks to repositories directly, introduce or update a service layer as part of the change.

### Service Layer
- Central location for business rules and workflow orchestration.
- Coordinate multi-domain operations and transaction boundaries.
- Enforce state transitions and policy rules.

### Repository Layer
- Encapsulate SQLAlchemy data access.
- Expose reusable query/write methods.
- Keep repositories free of business decisions.

### Model Layer
- Define persistence models and constraints only.
- Avoid embedding domain workflow logic in ORM models.

### Schema Layer
- Define API contracts and validation using Pydantic.
- Keep API schemas decoupled from ORM models.

## Critical Domain Rules
- Reservation is a core domain and should use dedicated transition enforcement (for example state_machine.py).
- Availability/conflict logic should be centralized in dedicated components (for example conflict_checker.py, buffer_manager.py).
- Enum definitions must stay centralized and shared across models, schemas, and services.

## Request Flow
- Enforce this flow for all write and read operations:
  - HTTP Request -> Router -> Service -> Repository -> Database

## Architectural Constraints
- Routers must not contain business logic.
- Services must not bypass repositories.
- Models must not contain domain workflow logic.
- Direct database access outside repositories is prohibited.

## Database And Migrations
- Keep database setup and sessions centralized in dedicated db modules.
- Register models consistently in shared metadata/base.
- Apply schema changes through Alembic migrations.
- Reflect enum/state constraints in persistence and migration strategy.

## Shared Concerns
- Place cross-cutting concerns in core/shared modules (config, logging, exceptions, DI, utilities).
- Prevent domain modules from depending on unrelated domain internals.

## Adoption Policy
- Migrate touched legacy code toward app/modules domain organization in the same change whenever feasible.
- Do not leave router-level database logic or model-level workflow logic in modified files.
- New and updated flows must follow explicit router -> service -> repository boundaries.

## Tradeoffs Awareness
- Benefits: domain ownership, scalability, centralized rules, better testability.
- Costs: more boilerplate, stricter boundaries, migration overhead.

## Disallowed Approaches
- Route handlers executing business workflows directly.
- Direct SQLAlchemy session usage in routers.
- Fat ORM models holding business process logic.
- Scattered availability logic or duplicated state-transition rules.
