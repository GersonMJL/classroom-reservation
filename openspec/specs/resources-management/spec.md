# Gestão de Recursos e Disponibilidade

## Purpose
Gerenciar os recursos fixos e móveis do sistema (equipamentos, mobiliário, softwares licenciados, chaves, suprimentos e kits), permitindo controle independente de inventário, escalas de disponibilidade, manutenção e checkout de materiais.

## Requirements

### Requirement: Cadastro e Classificação de Recursos
O sistema SHALL registrar recursos categorizados (`IT`, `AUDIOVISUAL`, `LABORATORY`, `GENERAL`, `FURNITURE`, `COMPUTING`, `ACCESS`) e tipificados (`EQUIPMENT`, `FURNITURE`, `SOFTWARE_LICENSE`, `KEY`, `SUPPLY`, `KIT`), definindo se são fixos a um ambiente ou móveis/compartilhados.

#### Scenario: Cadastro de recurso móvel
- **GIVEN** um administrador ou técnico cadastrando um projetor portátil
- **WHEN** envia `POST /api/v1/recursos` marcando `is_movable = true`
- **THEN** o recurso é registrado sem vinculação fixa permanente a um único ambiente, ficando disponível para alocação em reservas

### Requirement: Calendário Independente e Manutenção de Recursos
O sistema SHALL manter um calendário próprio para recursos móveis e permitir bloqueios operacionais para manutenção preventiva ou corretiva.

#### Scenario: Bloqueio de recurso para manutenção
- **GIVEN** um recurso que apresentou defeito ou requer calibração
- **WHEN** o técnico de suporte define um período de manutenção para o recurso
- **THEN** o sistema impede a inclusão deste recurso em novas reservas durante o intervalo de manutenção

### Requirement: Controle de Retirada e Devolução (Checkout)
O sistema SHALL rastrear o ciclo de retirada física e devolução de recursos móveis e chaves através de status de checkout (`CHECKED_OUT`, `RETURNED`, `OVERDUE`, `LOST`).

#### Scenario: Devolução de kit de equipamentos
- **GIVEN** um recurso retirado com status `CHECKED_OUT`
- **WHEN** o responsável devolve o equipamento e o operador registra a devolução
- **THEN** o status é atualizado para `RETURNED` e o item é liberado no inventário
