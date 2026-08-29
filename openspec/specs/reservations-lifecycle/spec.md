# Ciclo de Vida e Estrutura de Reservas

## Purpose
Gerenciar a criação, edição, encadeamento, recorrência e transições de estado de reservas simples, recorrentes e compostas (pai-filho), garantindo a aplicação estrita da máquina de estados, regras de buffers e integridade do calendário.

## Requirements

### Requirement: Criação de Reserva Simples e Recorrente
O sistema SHALL suportar a criação de reservas simples (uma data/horário) e recorrentes (diária, semanal, quinzenal) com associação de ambiente, recursos necessários, solicitante e responsável formal.

#### Scenario: Criação de reserva semanal para disciplina acadêmica
- **GIVEN** um professor autenticado solicitando uma sala às terças-feiras durante 16 semanas
- **WHEN** envia o formulário de reserva com regra de recorrência
- **THEN** o sistema valida a disponibilidade de todas as ocorrências e cria a série de reservas

### Requirement: Suporte a Reservas Compostas (Pai-Filho)
O sistema SHALL suportar reservas compostas (`COMPOSITE_PARENT` e `COMPOSITE_CHILD`) para eventos encadeados (ex: auditório principal + salas de apoio + laboratório), mantendo consistência de dependências.

#### Scenario: Cancelamento em cascata de reserva pai
- **GIVEN** uma reserva composta com um evento mestre e duas reservas de apoio filhas
- **WHEN** o solicitante cancela a reserva mestre informando a justificativa
- **THEN** o sistema cancela as reservas dependentes ou aciona a revisão de continuidade conforme regras configuradas

### Requirement: Máquina de Estados e Transições do Ciclo de Vida
O sistema SHALL implementar uma máquina de estados estrita que governa as transições entre `DRAFT`, `PENDING_APPROVAL`, `PRE_BLOCKED`, `APPROVED`, `IN_USE`, `COMPLETED`, `REJECTED`, `CANCELLED`, `NO_SHOW` e `EXPIRED`.

#### Scenario: Transição inválida de status
- **GIVEN** uma reserva que já está com status `COMPLETED` ou `CANCELLED`
- **WHEN** uma requisição tenta alterar seu status diretamente para `IN_USE` ou `APPROVED`
- **THEN** o sistema rejeita a operação com erro de validação de estado inválido

### Requirement: Inclusão Automática de Buffers Operacionais
O sistema SHALL criar automaticamente períodos de buffer prévio (setup) e posterior (limpeza/devolução) no calendário para cada reserva aprovada.

#### Scenario: Geração de bloqueio de buffer
- **GIVEN** uma reserva das 14:00 às 16:00 em um ambiente com buffer de setup de 15 min e limpeza de 30 min
- **WHEN** a reserva é confirmada
- **THEN** o calendário do ambiente fica bloqueado no intervalo das 13:45 até as 16:30

### Requirement: Prevenção de Concorrência e Transações Atômicas
O sistema SHALL executar a criação e confirmação de reservas sob transações atômicas com bloqueio pessimista (`SELECT ... FOR UPDATE`) ou lock distribuído, garantindo que duas requisições simultâneas para o mesmo espaço físico e horário nunca resultem em double-booking.

#### Scenario: Submissão simultânea concorrente para o mesmo ambiente
- **GIVEN** duas requisições simultâneas de reserva para o mesmo ambiente e intervalo
- **WHEN** os dois usuários submetem o agendamento no mesmo milissegundo
- **THEN** apenas a primeira transação efetiva a reserva com sucesso, e a segunda transação é rejeitada com mensagem de conflito de disponibilidade
