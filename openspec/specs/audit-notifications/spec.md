# Auditoria, Versionamento e Notificações

## Purpose
Garantir a rastreabilidade integral de todas as mutações e eventos administrativos no sistema por meio de logs de auditoria imutáveis, versionamento e snapshots de reservas, além de despachar notificações em tempo real para os usuários.

## Requirements

### Requirement: Log de Auditoria Imutável
O sistema SHALL registrar logs de auditoria estruturados para todas as ações relevantes (`CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `CANCEL`, `CHECKIN`, `CHECKOUT`, `ASSIGN_RESOURCE`, `REMOVE_RESOURCE`), contendo o identificador do ator, endereço IP, entidade afetada e payload com valores anteriores e posteriores.

#### Scenario: Registro de alteração de horário de reserva
- **GIVEN** um administrador alterando o horário de uma reserva aprovada
- **WHEN** a alteração é confirmada e persistida no banco
- **THEN** um registro é adicionado na tabela de `audit_logs` contendo o estado prévio e o novo estado em formato JSON

### Requirement: Versionamento e Snapshots de Reservas
O sistema SHALL criar um snapshot histórico numerado (`ReservationVersion`) a cada modificação substancial no ciclo de vida da reserva.

#### Scenario: Consulta de histórico de versões
- **GIVEN** uma reserva que passou por criação, reaprovação e ajuste de recursos
- **WHEN** o gestor ou auditor solicita o histórico da reserva
- **THEN** o sistema retorna a linha do tempo com todas as versões e dados consolidados da época de cada versão

### Requirement: Central de Notificações do Usuário
O sistema SHALL gerar notificações in-app e despachos de alertas para os usuários envolvidos sempre que houver mudança de status de reservas, aprovações pendentes, advertências ou prazos de check-in.

#### Scenario: Notificação de aprovação recebida
- **GIVEN** uma reserva aprovada pelo gestor
- **WHEN** a transição de aprovação é concluída
- **THEN** uma notificação do tipo `RESERVATION_APPROVED` é adicionada na caixa de entrada do solicitante com link direto para os detalhes da reserva
