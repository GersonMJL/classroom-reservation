# Governança, Penalidades e Recursos

## Purpose
Prover governança e responsabilização sobre o uso de salas e laboratórios, aplicando penalidades administrativas por infrações operacionais (no-show, cancelamento tardio, dano material, uso indevido, tempo excedido e violação de segurança) e processando recursos administrativos (appeals).

## Requirements

### Requirement: Aplicação de Penalidades
O sistema SHALL registrar penalidades vinculadas a usuários ou unidades organizacionais com tipos estritos (`NO_SHOW`, `LATE_CANCELLATION`, `DAMAGE`, `MISUSE`, `OVERTIME`, `SAFETY_VIOLATION`) e status (`PENDING`, `APPLIED`, `WAIVED`, `UNDER_APPEAL`, `RESOLVED`).

#### Scenario: Penalidade automática por no-show recorrente
- **GIVEN** um usuário que acumulou 2 no-shows em 30 dias
- **WHEN** o sistema processa a segunda falta
- **THEN** uma penalidade com status `APPLIED` e pontos de restrição é gerada

### Requirement: Bloqueio Temporário de Agendamento por Penalidade Ativa
O sistema SHALL impedir a criação de novas reservas por usuários ou unidades que possuam penalidades ativas com efeito suspensivo.

#### Scenario: Usuário com penalidade tenta submeter nova reserva
- **GIVEN** um usuário com penalidade ativa válida por 15 dias
- **WHEN** o usuário tenta submeter uma nova solicitação de reserva
- **THEN** o sistema recusa a solicitação exibindo mensagem com o motivo da suspensão e a data de expiração

### Requirement: Submissão e Julgamento de Recursos (Appeals)
O sistema SHALL permitir que o usuário penalizado submeta uma justificativa formal (recurso), e que um administrador aprove (`APPROVED`) ou rejeite (`REJECTED`) o recurso.

#### Scenario: Deferimento de recurso por atestado
- **GIVEN** um usuário penalizado por no-show que anexou comprovante de emergência médica
- **WHEN** o administrador analisa o recurso e clica em Aprovar Recurso
- **THEN** o status do recurso muda para `APPROVED`, o status da penalidade muda para `WAIVED` e a restrição de agendamento é removida
