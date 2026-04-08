---
description: "Use when designing or changing domain models, database schemas, API contracts, validation, or integrations involving categorical fields like type, status, purpose, severity, method, and priority. Enforces strict enum usage and transition rules."
applyTo: ["backend/**/*.py", "frontend/app/**/*.{ts,tsx}"]
---
# Domain Enum Standardization

## Objective
- Ensure all categorical fields use explicit enums instead of free text values.

## Core Rule
- Any field representing a finite set of values must be implemented and used as an enum.
- This includes fields such as: type, status, purpose, severity, method, and priority.
- Free text categorical values are not allowed.

## Enforcement Rules

### 1. Domain Layer
- Define enums centrally in the domain model using a single source-of-truth module.
- Import and reuse enum definitions from this canonical module; do not duplicate or redefine enums across modules.

### 2. Database Layer
- Use native enum types where supported.
- Otherwise enforce constraints that restrict values to the defined set.

### 3. Application Layer
- Validate enum inputs at service boundaries.
- Reject invalid or unknown values.

### 4. API Layer
- Accept and return only valid enum values.
- Do not allow arbitrary strings.

### 5. Cross-Service Consistency
- Reuse the same enum definitions across services, events, and integrations.

## Canonical Enum Definitions

### Environment
- ENVIRONMENT.type: CLASSROOM, LABORATORY, AUDITORIUM, MEETING_ROOM, STUDIO, MULTIPURPOSE
- ENVIRONMENT.criticality: COMMON, CONTROLLED, RESTRICTED

### Resource
- RESOURCE.type: EQUIPMENT, FURNITURE, SOFTWARE_LICENSE, KEY, SUPPLY, KIT

### Reservation
- RESERVATION.status: DRAFT, PENDING_APPROVAL, PRE_BLOCKED, APPROVED, REJECTED, CANCELLED, IN_USE, COMPLETED, NO_SHOW, EXPIRED
- RESERVATION.purpose: CLASS, MEETING, RESEARCH, EVENT, MAINTENANCE, TRAINING
- RESERVATION.type: SIMPLE, RECURRING, COMPOSITE_PARENT, COMPOSITE_CHILD

### Calendar
- CALENDAR_BLOCK.type: ADMIN_BLOCK, MAINTENANCE, RECURRING_EVENT, BUFFER, HOLIDAY, CLOSURE
- CALENDAR_BLOCK.priority: CRITICAL, HIGH, NORMAL, LOW

### Support And Operations
- RESERVATION_SUPPORT.support_type: IT_SUPPORT, AUDIOVISUAL, LAB_TECHNICIAN, SECURITY, CLEANING
- CHECKIN.method: MANUAL, QR_CODE, CARD_ACCESS, KEY_PICKUP, SENSOR_TRIGGERED
- INCIDENT.severity: LOW, MEDIUM, HIGH, CRITICAL

### Approval
- APPROVAL.status: PENDING, APPROVED, REJECTED, REQUIRES_CHANGES, ESCALATED

### Restrictions
- ENVIRONMENT_RESTRICTION.type: TIME_WINDOW, PURPOSE_LIMITATION, CAPACITY_OVERRIDE, ACCESS_CONTROL, SAFETY_REQUIREMENT

### Governance
- PENALTY.type: NO_SHOW, LATE_CANCELLATION, DAMAGE, MISUSE, OVERTIME, SAFETY_VIOLATION
- PENALTY.status: PENDING, APPLIED, WAIVED, UNDER_APPEAL, RESOLVED
- APPEAL.status: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED

### Audit
- AUDIT_LOG.action: CREATE, UPDATE, DELETE, APPROVE, REJECT, CANCEL, CHECKIN, CHECKOUT, ASSIGN_RESOURCE, REMOVE_RESOURCE

### Resource Checkout
- RESOURCE_CHECKOUT.status: CHECKED_OUT, RETURNED, OVERDUE, LOST

## Behavioral Constraints
- Never introduce values outside the defined enums.
- Do not use fallback values like OTHER unless explicitly approved.
- Any enum change must include schema migration, code update, and API versioning assessment.

## State Management
- Prefer explicit valid-transition rules for state-driven enums.
- Prioritize transition rules for RESERVATION.status, APPROVAL.status, and PENALTY.status during domain and service updates.

## Tradeoffs Awareness

### Benefits
- Strong data integrity.
- Simplified validation.
- Consistent reporting.
- Clear workflow modeling.

### Costs
- Reduced flexibility.
- Coordinated updates required.
- Migration overhead.

## Disallowed Approaches
- Free text categorical fields.
- Uncontrolled string values.
- Inconsistent enum definitions across services.
