# Detailed System Description

## Room and Laboratory Reservation System

The room and laboratory reservation system aims to centrally manage the use of physical spaces (classrooms, auditoriums, meeting rooms, laboratories, studios, multipurpose rooms) and their associated resources (projectors, computers, kits, furniture, air conditioning, keys, supplies, licensed software). It organizes the complete cycle of availability, request, approval, use, and closure of reservations, with administrative traceability and rules to prevent scheduling conflicts and improper use.

Each space is treated as an organizational asset with operational attributes: location (campus, building, floor), capacity, accessibility, permitted purpose, operating hours, preparation and closure rules, support needs (IT, audiovisual, lab technician), security requirements, and — in the case of laboratories — requester qualification requirements. The system also links spaces to a set of restrictions and policies, such as recurring blocks (fixed classes, maintenance), minimum advance notice windows, delay tolerance, setup and cleaning time (buffer), and reservation limits per person/unit.

The reservation logic must support simple requests (one room for 2 hours) and more complex scenarios, such as recurring reservations (weekly), chained reservations (room + laboratory + auditorium on the same day), unit-based preferential allocation, and mandatory approval for controlled spaces. Beyond managing the calendar, the system must establish an accountability mechanism for usage, recording the requester, the person responsible for the event/activity, expected participants, required resources, accepted terms of responsibility, and — where applicable — check-in/check-out and incident logs (damage, delays, incidents).

# Business Rules

## **1) Environment and Resource Registration and Classification**

1.1. Every environment must have a unique identifier, type, location, and capacity.
1.2. Environments must be classified by criticality, such as common, controlled, or restricted, which impacts approval, modification, and usage rules.
1.3. Environments may require mandatory attributes depending on type, including technical supervisor, safety rules, and operational constraints.
1.4. Resources linked to environments may be fixed or mobile.
1.5. Mobile or pooled resources must maintain an independent availability calendar.
1.6. Resource logistics must be considered, including transfer time between locations when applicable.

---

## **2) Availability, Calendar, Buffers, and Conflicts**

2.1. Reservations must not conflict with others, considering setup, cleaning, and logistics buffers.
2.2. Buffers are system generated blocks and cannot be modified by regular users.
2.3. Only administrative or technical roles may adjust buffers after operational validation.
2.4. Late cancellations for critical environments must not remove required safety buffers.
2.5. Administrative blocks take priority over all reservations.
2.6. A reservation is only valid if the environment, required resources, and support are all available simultaneously.
2.7. Institutional closures invalidate reservations unless explicitly authorized.

---

## **3) Reservation Structure and Complex Scenarios**

3.1. The system must support simple, recurring, and composite reservations.
3.2. Composite reservations must follow a parent child structure with a master identifier and multiple child reservations.
3.3. Dependencies between reservations must be enforced automatically.
3.4. Cancellation of a prerequisite reservation must trigger review of dependent reservations.
3.5. Partial cancellation requires the requester to confirm continuation or rebook remaining segments.

---

## **4) Reservation States and Lifecycle**

4.1. Reservations must follow defined lifecycle states.
4.2. Only approved reservations block the calendar, except when temporary pre blocking is configured.
4.3. Any significant modification to an approved reservation must revert its status to pending.
4.4. Controlled environments always require manual reapproval after changes.
4.5. Cancellations must record reason and responsible party.
4.6. The system must maintain a full version history of reservations.

---

## **5) Request Rules, Lead Time, and Modifications**

5.1. Reservations must respect minimum and maximum lead time constraints.
5.2. Priority windows may exist for specific organizational units.
5.3. Requests outside operating hours require explicit authorization.
5.4. Long duration reservations require justification and may require additional approval.
5.5. All modifications must preserve the previous state for audit purposes.
5.6. Changes in common environments without conflicts may be auto approved.

---

## **6) Eligibility, Authorization, and Accountability**

6.1. Controlled or restricted environments require qualified users.
6.2. Laboratories may require certifications, training, or project affiliation.
6.3. Every reservation must include both a requester and a responsible party.
6.4. High risk activities require formal acceptance of responsibility and a technical supervisor.

---

## **7) Resources, Support, and Operational Capacity**

7.1. Mobile resources must have independent availability validation.
7.2. Reservations requiring support are only valid if support staff is available.
7.3. The system must enforce limits based on available support personnel.
7.4. If support is unavailable, the reservation must remain pending.
7.5. Resources requiring physical checkout must track responsibility and return deadlines.

---

## **8) Capacity, Purpose, and Compliance**

8.1. The number of participants must not exceed environment capacity.
8.2. The purpose of the reservation must align with the environment type.
8.3. Unauthorized transfer of reservation ownership or usage is prohibited.

---

## **9) Usage, Check In, Sensors, and Closure**

9.1. The in use status must be triggered by the earliest valid event.
9.2. Valid events include digital check in, key pickup, or electronic access activation.
9.3. Sensor integration may automatically mark a reservation as no show if no activity is detected within tolerance.
9.4. Late arrival may result in no show status.
9.5. Extensions are only allowed if no conflicts exist and rules are respected.
9.6. Closure may require a mandatory checklist.
9.7. Missing check out must trigger operational verification before releasing the environment.

---

## **10) Penalties, Liability, and Recurrence**

10.1. Operational penalties apply to the requester.
10.2. Safety and damage penalties apply to the responsible party.
10.3. Repeated violations may result in temporary restrictions for individuals or organizational units.
10.4. Penalties must be configurable and allow administrative appeal.
10.5. Critical environments may require deposits or additional guarantees.

---

## **11) Audit, Traceability, and Governance**

11.1. All relevant administrative actions must be auditable.
11.2. The system must maintain before and after records for all changes.
11.3. Reports must reflect consolidated operational and managerial data.
11.4. The system must support analysis of utilization, demand, incidents, and performance.
