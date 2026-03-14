# Detailed Use Case Documentation for Classroom and Laboratory Booking System

---

## 1. Functional Requirements (FR)

Detailed description of system features and interaction flows.

---

### FR01 — Environment and Asset Registration

**Actors:** Administrator\
**Pre-condition:** User authenticated with Administrator profile.

| Flow | Description |
|---|---|
| **Main** | 1. Accesses environment management; 2. Clicks "New Environment"; 3. Fills in ID, type, location, capacity, accessibility, permitted purpose, and criticality classification; 4. Configures mandatory attributes by type (e.g., laboratory requires a designated technical supervisor and specific regulations); 5. Links fixed resources and defines optional resources with separate availability validation; 6. Confirms. |
| **Alternative** | The Administrator may edit existing environments and save changes, including updates to linked resources and classification. |
| **Exception — Duplicate ID** | Error message displayed; registration is blocked. |
| **Exception — Empty required fields** | Confirmation is blocked; pending fields are highlighted. |
| **Exception — Lab type without technical supervisor** | For laboratory-type environments, the system blocks registration if no technical supervisor is designated. |

**Post-condition:** Environment registered with its criticality classification (common, controlled, or restricted), type-specific attributes, and linked resources; available for new bookings.

---

### FR02 — Booking Request

**Actors:** Requester, System
**Pre-condition:** Requester authenticated; environment available for the requested period; requester qualified for the venue with valid certifications.

**Main Flow:**

1. Accesses "New Request".
2. Selects environment, date, and time slots.
3. System validates requester eligibility (certifications and profile required by the environment).
4. Enters activity supervisor, purpose, and required resources.
5. System validates compatibility of the stated purpose with the environment type.
6. System checks that the expected number of participants does not exceed the environment's capacity.
7. Accepts terms of responsibility (if required by the environment).
8. Confirms the request.

**Alternative Flows:**

- **Recurrence:** Define frequency (daily, weekly, monthly) and end date. Each occurrence is validated individually; conflicts are refused or flagged as pending per policy.
- **Additional resources:** Add mobile equipment or supplies, with availability validation within the same time slot.
- **Chained booking:** Ability to request multiple environments on the same day (e.g., meeting room + laboratory + auditorium), provided each is individually validated.

**Exception Flows:**

- **Scheduling conflict:** System blocks submission and suggests alternative time slots.
- **Advance notice deadline:** System prevents submission and informs the requester of the environment's rule (minimum and maximum).
- **Insufficient eligibility:** System blocks the request and lists which certifications are missing or expired.
- **Capacity exceeded:** System blocks confirmation and displays the environment's maximum capacity.
- **Incompatible purpose:** System blocks submission and describes the incompatibility with the environment type.

**Post-condition:** Booking registered with status **Requested**. Proceeds to approval or direct confirmation based on the environment's configuration.

---

### FR03 — Administrative Blocks

**Actors:** Administrator
**Pre-condition:** User authenticated with Administrator profile.

**Main Flow:**

1. Accesses the environment's calendar management.
2. Selects the period and block type (maintenance, deep cleaning, institutional event, public holiday, recess, or outside operating hours).
3. Enters the reason and, where applicable, the responsible party.
4. Confirms the block.

**Alternative Flow:** The Administrator may create recurring blocks (e.g., fixed weekly classes) with a defined start and end date.

**Exception Flows:**

- **Conflict with an existing approved booking:** System displays the list of affected bookings and requests confirmation. The Administrator may cancel conflicting bookings with automatic notification to requesters.

**Post-condition:** Period blocked with priority over new requests. Conflicting approved bookings are cancelled with notification and a recorded reason.

---

### FR04 — Approval Flow and Pre-block

**Actors:** Approver, System
**Pre-condition:** Pending request for an environment requiring approval; time slot pre-blocked.

> **Note:** During the "Requested" phase, the time slot is reserved (pre-block) to prevent other users from attempting to book the same slot while the Approver is deciding. The pre-block expires automatically if the review deadline is reached.

**Main Flow:** Approver reviews the request details (purpose, supervisor, resources, requester eligibility) and approves. System confirms, changes status to **Approved**, and notifies the Requester.

**Alternative Flow:** Approver rejects with a mandatory justification. System changes status to **Rejected**, releases the time slot, and notifies the Requester.

**Exception:** If the review deadline expires, the system cancels the pre-block, releases the time slot automatically, and records the reason as Approver inactivity.

**Post-condition:** Status changed to **Approved** (if approved) or **Rejected** (if rejected), with the time slot released in the latter case.

---

### FR05 — Check-in, Check-out, and No-show

**Actors:** Requester, Support Operator, System
**Pre-condition:** Booking with status **Approved** and start time reached (within the configured tolerance window).

- **Check-in:** Records the start of use. Status changed to **In Use**.
- **Check-out:** Records the end of use and releases the environment. Status changed to **Closed**. For laboratories, the system presents a closing checklist (power off equipment, proper disposal, cleaning, locks) before finalizing.
- **Booking extension:** Permitted only if there is no conflict with a subsequent booking and the extension respects operating hours and setup/cleaning buffers.
- **No-show:** If check-in does not occur within the tolerance window, the system cancels the booking, releases the space, changes status to **No-show**, and logs the occurrence for recurrence tracking.
- **Automatic closure:** If check-out is not recorded manually, the system closes the booking at the end of the configured time slot for audit purposes. Status changed to **Closed**.

**Post-condition:** Environment released for new bookings. No-show occurrence recorded and linked to the requester for penalty tracking.

---

### FR06 — Incident and Damage Reporting

**Actors:** Requester, Technical Supervisor
**Pre-condition:** Booking with status **In Use** being closed via check-out.

**Flow:** Upon check-out, the system presents a form to report damage, equipment failures, incidents, or supply consumption, allowing photo attachments and a detailed description.

**Post-condition:** Incident recorded and linked to the booking and responsible party for administrative traceability. Notification sent to the Technical Supervisor where applicable.

---

### FR07 — Booking State Control

The system enforces the logical transitions between the following states according to booking lifecycle events:

```
Requested ──► Approved ──► In Use ──► Closed
    │              │
    │           Rejected
    │
Cancelled
    │
 No-show
```

**State descriptions:**

| State | Description |
|---|---|
| **Requested** | Booking registered; time slot pre-blocked pending review. |
| **Pending Approval** | Awaiting Approver action in a controlled environment. |
| **Approved** | Booking confirmed; time slot blocked on the calendar. |
| **Rejected** | Approver refused the request with justification; time slot released. |
| **Cancelled** | Cancelled by the requester or administratively; reason and responsible party recorded. |
| **In Use** | Check-in completed; environment in use. |
| **Closed** | Check-out completed or automatic closure; environment released. |
| **No-show** | Check-in not completed within the tolerance window; booking automatically cancelled. |

**Transition rules:**

- Only **Approved** bookings permanently block the calendar, except for the temporary pre-block during the **Requested** phase.
- **Cancelled** bookings release the environment immediately; reason and responsible party are recorded when the cancellation is administrative.
- **No-show** occurrences are logged for recurrence tracking and penalty enforcement.

---

### FR08 — Resource Management

**Actors:** System, Administrator
**Pre-condition:** Environment registered with associated resources.

**Rules:**

- Fixed equipment linked to the environment is automatically included in the booking.
- Optional resources must be explicitly requested; the system validates availability within the same booking interval, preventing conflicts with other bookings requiring the same item.
- Resources requiring pickup and return (keys, access badges, kits, laptops) generate a responsibility record with a defined deadline, linked to the booking's responsible party.
- Bookings requiring specialist support (IT, audiovisual, laboratory technician) may only be approved if service capacity is available within the requested time window.

**Post-condition:** Resources confirmed and reserved for the booking interval; responsibility records created for pickup/return items.

---

### FR09 — Penalties, Restrictions, and Recurrence *(new)*

**Actors:** System, Administrator
**Pre-condition:** A recorded infraction (no-show, late cancellation, confirmed damage).

**Main Flow:**

1. System identifies the infraction according to configured rules (type and recurrence threshold).
2. Applies a proportional penalty based on infraction type (e.g., temporary block on new bookings).
3. Notifies the penalised user with a description of the infraction, the penalty applied, and its duration.
4. Records the penalty in the user's history for audit purposes.

**Alternative Flow — Administrative Appeal:**

1. User requests a penalty review.
2. Administrator reviews and may reverse or uphold the penalty, with a mandatory justification record.

**Exception:** For critical environments, policy may require a deposit or two-step authorisation before a new booking is allowed following a penalty.

**Post-condition:** Penalty recorded and applied; user notified. Infraction history updated for recurrence tracking.

---

## 2. Non-Functional Requirements (NFR)

Business rules, security, and technical constraints.

---

### NFR01 — Eligibility and Authorisation

**Objective:** Prevent users without adequate training or credentials from accessing controlled and restricted environments.

**Validation:** At submission time, the system cross-checks the environment's requirements against the user's certifications and profile. If certifications are expired, absent, or the profile is insufficient, the booking is blocked and the specific pending items are displayed.

**Scope:** Applies to environments classified as controlled or restricted; laboratories may additionally require a link to an authorised project.

---

### NFR02 — Traceability and Audit

**Rule:** Every creation, modification, or deletion of bookings, blocks, and penalties generates an immutable log entry.

**Captured data:** Responsible user, date/time, action performed, previous state, and new state.

**Restriction:** Audit records cannot be edited by any profile, including the Administrator. Version history is maintained for approved bookings that have been subsequently modified.

---

### NFR03 — Security Compliance

**Rule:** High-risk environments — including chemistry, biosafety, and machinery laboratories — require a "Digital Acceptance" of activity-specific terms of responsibility.

**Persistence:** The acceptance is recorded with a timestamp, user ID, and identification of the accepted terms document.

**Restriction:** Without a valid recorded acceptance, the booking cannot be confirmed.

---

### NFR04 — Advance Notice Rules and Preferential Windows

**Advance notice:** The system validates minimum lead times (e.g., 24 hours in advance) and maximum booking horizons (e.g., up to 30 days ahead) as configured per environment or organisational unit.

**Preferential windows:** High-demand environments may have preferential booking windows per organisational unit (e.g., priority given to the department that owns the laboratory). Requests outside the preferential window may be subject to conditional approval.

**Exceptions:** Bookings outside the environment's operating hours are only permitted with explicit authorisation, and must include a recorded plan for support and security coverage.

---

### NFR05 — Management Reports

**Capability:** Generation of reports and charts covering:

- Occupancy rate by environment, period, and organisational unit.
- No-show index and recurrence rate by user.
- Demand by environment (requests vs. approvals vs. rejections).
- Logged incidents (damage, accidents) by environment and responsible party.
- Applied penalties and administrative appeals.

**Output:** Export in PDF and Spreadsheet (Excel/CSV) formats.

**Access:** Available to Administrator profiles and Managers with reporting permissions.

---
