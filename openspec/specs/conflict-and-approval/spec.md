# Gestão de Conflitos e Fluxos de Aprovação

## Purpose
Garantir a verificação em tempo real de conflitos de disponibilidade (ambiente, recursos, equipe de suporte técnico e bloqueios administrativos) e coordenar o motor de aprovação automática e manual para solicitações de reservas.

## Requirements

### Requirement: Detecção de Conflitos Multidimensionais
O sistema SHALL validar a disponibilidade simultânea do espaço físico, dos recursos móveis solicitados, da escala de suporte técnico e da ausência de bloqueios administrativos (`ADMIN_BLOCK`, `MAINTENANCE`, `CLOSURE`, `HOLIDAY`).

#### Scenario: Detecção de conflito por sobreposição de recursos móveis
- **GIVEN** um projetor de alta definição já alocado para outra reserva das 10:00 às 12:00
- **WHEN** um usuário tenta reservar o mesmo projetor para uma sala diferente das 11:00 às 13:00
- **THEN** o sistema recusa a solicitação indicando indisponibilidade do recurso no horário

### Requirement: Sugestão Inteligente de Horários Alternativos
O sistema SHALL sugerir intervalos de horários ou salas alternativas caso ocorra conflito na solicitação do usuário.

#### Scenario: Sugestão de slot livre próximo
- **GIVEN** uma sala solicitada que está ocupada no horário desejado
- **WHEN** o usuário recebe a mensagem de conflito
- **THEN** o sistema apresenta opções de horários livres no mesmo dia ou ambientes compatíveis de mesma capacidade

### Requirement: Motor de Aprovação Manual e Automática
O sistema SHALL aprovar automaticamente solicitações para ambientes de criticidade `COMMON` sem conflitos, e encaminhar para aprovação manual (`PENDING_APPROVAL`) solicitações para ambientes `CONTROLLED` ou `RESTRICTED`.

#### Scenario: Aprovação manual de laboratório controlado
- **GIVEN** uma reserva submetida para um laboratório com status `PENDING_APPROVAL`
- **WHEN** o gestor responsável avalia a justificativa e clica em Aprovar
- **THEN** o status da aprovação muda para `APPROVED`, a reserva é marcada como `APPROVED`, e o solicitante é notificado

### Requirement: Consulta Acelerada de Conflitos e Disponibilidade
O sistema SHALL utilizar índices de banco de dados otimizados para busca temporal e cache de buffers calculados para responder a consultas de disponibilidade e detecção de conflitos em menos de 50 milissegundos sob concorrência.

#### Scenario: Consulta de conflito com alta densidade de agendamentos
- **GIVEN** um ambiente com centenas de reservas e buffers no mês
- **WHEN** o motor de verificação consulta a disponibilidade
- **THEN** a verificação de sobreposição é concluída em tempo sub-50ms utilizando índices compostos
