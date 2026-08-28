## ADDED Requirements

### Requirement: Prevenção de Concorrência e Transações Atômicas
O sistema SHALL executar a criação e confirmação de reservas sob transações atômicas com bloqueio pessimista (`SELECT ... FOR UPDATE`) ou lock distribuído, garantindo que duas requisições simultâneas para o mesmo espaço físico e horário nunca resultem em double-booking.

#### Scenario: Submissão simultânea concorrente para o mesmo ambiente
- **WHEN** dois usuários submetem simultaneamente reservas para a mesma sala e intervalo de tempo sobreposto
- **THEN** apenas a primeira transação efetiva a reserva com sucesso, e a segunda transação é rejeitada com mensagem de conflito de disponibilidade
