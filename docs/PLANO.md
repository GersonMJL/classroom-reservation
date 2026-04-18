# Sistema de Reserva de Salas — Plano de Desenvolvimento Backend

## Resumo de Lacunas (Gap Summary)

| Área | Requisito dos Docs | Implementado Atualmente |
|---|---|---|
| Esquema DB | Segue o diagrama ER | 10 tabelas ausentes, múltiplas lacunas de campos |
| Roteadores ativos | 11 módulos | 5 (auth, users, environments, locations, resources) |
| Enums | ~15 tipos de enum | ~6 tipos de enum parciais |
| Aplicação de RBAC | Verificação de roles em todos os endpoints | Apenas autenticação (sem verificação de roles) |
| Ciclo de vida da reserva | Máquina de 10 estados | Sem máquina de estados |
| Detecção de conflitos | Verificação de disponibilidade com buffer | Não implementado |
| Fluxo de aprovação | Auto/manual baseado em criticidade | Não implementado |
| Check-in/check-out | Embutido na linha da reserva | Tabelas separadas, sem lógica |
| Automação de penalidades | Aplicação automática em no-show/atraso | Não implementado |
| Tipos de reserva | SIMPLES, RECORRENTE, COMPOSTA | Sem campo de tipo |
| Bloqueios de calendário | Bloqueios de prioridade geridos por admin | Sem endpoints |
| Notificações | Aprovação, cancelamento, penalidade | Não implementado |
| Testes | Unitários + integração | Nenhum |

---

## Fase 1 — Completude de Enums e Registro de Módulos

**Objetivo:** Tornar todos os módulos acessíveis e padronizar os enums de domínio.

### 1.1 Completar `shared/enums.py`

Adicionar enums faltantes: `ReservationStatus`, `ReservationType`, `TipoVinculo`, `CalendarBlockType`, `IncidentSeverity`, `ApprovalStatus`, `PenaltyType`, `AuditAction`, etc.

### 1.2 Registrar Roteadores no `main.py`

Registrar roteadores para: `organizational_units`, `reservations`, `qualifications`, `operations`, `governance`, `audit`.

---

## Fase 2 — Core de Reservas e Detecção de Conflitos

**Objetivo:** Implementar o ciclo de vida da reserva com verificação rigorosa de disponibilidade.

### 2.1 Serviço de Detecção de Conflitos

Criar `conflict_checker.py`:
- Verificar sobreposições no mesmo ambiente (considerando buffers).
- Verificar `disponibilidade_recurso`.
- Verificar bloqueios de manutenção e `buffer_execucao`.

### 2.2 Máquina de Estados de Status

Criar `state_machine.py` para gerenciar transições (ex: `APPROVED` → `IN_USE` via check-in). Cada transição registra um log em `historico_status_reserva`.

---

## Fase 3 — Fluxo de Aprovação e Qualificações

**Objetivo:** Lógica de aprovação auto/manual e validação de pré-requisitos do usuário.

- **Ambientes COMUNS:** Aprovação automática se dentro da política.
- **Ambientes CONTROLADOS/RESTRITOS:** Status cai como `PENDING_APPROVAL`.
- **Qualificações:** Verificar se o usuário possui as certificações exigidas pelo ambiente.

---

## Fase 4 — Operações (Check-in / Check-out / No-Show)

**Objetivo:** Implementar o ciclo operacional diário.

- **Check-in:** Valida janela de tolerância (±15 min).
- **Check-out:** Define o fim real e cria o `buffer_execucao` (DEPOIS).
- **No-Show:** Tarefa em segundo plano que penaliza reservas sem check-in após a tolerância.
- **Liberação Antecipada:** Endpoint para liberar o buffer de limpeza/organização antes do previsto.

---

## Fase 5 — Governança (Penalidades e Recursos)

**Objetivo:** Sistema de punição configurável.

- **Escalonamento:** Ex: 3 no-shows em 30 dias resultam em bloqueio de novas reservas por 30 dias.
- **Recursos (Appeals):** Permitir que usuários contestem penalidades para revisão do admin.

---

## Fase 6 — Tipos Avançados de Reserva e Manutenção

- **Reservas Recorrentes:** Gerar ocorrências baseadas em RRULE (iCal); falha atômica se houver conflito em qualquer data.
- **Reservas Compostas:** Agrupar múltiplas reservas (ex: várias salas para um evento); se um item crítico é cancelado, o grupo é alertado.
- **Gestão de Manutenção:** Endpoints para bloquear salas/equipamentos para reparo.

---

## Fase 7 — Aplicação de RBAC (Controle de Acesso)

**Objetivo:** Restringir endpoints baseados em roles (ADMIN, TECHNICIAN, REQUESTER, etc.).

---

## Fase 8 — Notificações (Eventos Internos)

Implementar `NotificationService` para registrar eventos de aprovação, rejeição e penalidades no `AuditLog` e saída padrão (preparando para integração futura com E-mail/Push).

---

## Fase 9 — Testes

Prioridades:
1. Detecção de conflitos.
2. Transições da máquina de estados.
3. Validação de prazos (Lead Time) por papel.
4. Ciclo completo de vida da reserva (E2E).

---

## Verificação por Fase

- **Fase 2:** `POST /reservations` retorna 409 em caso de conflito.
- **Fase 4:** Job de no-show cria penalidade automaticamente.
- **Fase 7:** Usuário comum recebe 403 ao tentar criar ambientes.
