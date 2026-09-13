# Operações, Check-in e Gestão de Incidentes

## Purpose
Gerenciar a operação presencial dos espaços reservados através de mecanismos de check-in e check-out, detecção automatizada de ausência (no-show) e de tempo excedido (overtime), além do registro e acompanhamento de incidentes e avarias.

## Requirements

### Requirement: Registro de Check-in e Início de Uso
O sistema SHALL permitir a realização de check-in através de múltiplos métodos (`MANUAL`, `QR_CODE`, `CARD_ACCESS`, `KEY_PICKUP`, `SENSOR_TRIGGERED`), alterando o status da reserva de `APPROVED` para `IN_USE`.

#### Scenario: Check-in realizado dentro da tolerância
- **GIVEN** uma reserva aprovada com início às 09:00 e tolerância de 15 minutos
- **WHEN** o usuário realiza check-in às 09:08 via QR Code
- **THEN** o status da reserva passa para `IN_USE` e o timestamp de início real é registrado

### Requirement: Detecção Automática de No-Show
O sistema SHALL executar rotinas em background que identificam reservas sem check-in após a expiração da janela de tolerância, alterando o status para `NO_SHOW` e liberando o ambiente para novas reservas.

#### Scenario: Expiração da tolerância de check-in
- **GIVEN** uma reserva aprovada com início às 10:00 e tolerância até as 10:15
- **WHEN** o job do scheduler executa às 10:16 sem registro de check-in
- **THEN** a reserva é marcada como `NO_SHOW`, o ambiente é desocupado no calendário e um evento de penalidade potencial é gerado

### Requirement: Registro e Gestão de Incidentes
O sistema SHALL permitir o relato de incidentes ocorridos durante o uso do espaço (avarias em equipamentos, problemas elétricos, atrasos, quebra de regras de segurança), categorizados por severidade (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

#### Scenario: Relato de avaria em equipamento de laboratório
- **GIVEN** um técnico de suporte inspecionando o ambiente após uma reserva
- **WHEN** cadastra um incidente com severidade `HIGH` anexando descrição e custos estimados
- **THEN** o incidente fica vinculado à reserva e ao responsável para apuração de responsabilidade
