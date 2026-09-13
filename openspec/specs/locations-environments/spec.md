# Gestão de Locais e Ambientes

## Purpose
Gerenciar a hierarquia física de localizações (campus, prédio, andar) e o catálogo de ambientes físicos (salas de aula, auditórios, laboratórios, estúdios, salas multiuso) com suas respectivas capacidades, criticidades, políticas de uso, requisitos e restrições operacionais.

## Requirements

### Requirement: Cadastro e Hierarquia de Localizações
O sistema SHALL permitir o cadastro e consulta de locais contendo campus, prédio e andar para associação com ambientes e recursos.

#### Scenario: Criação de localidade física
- **GIVEN** um administrador autenticado
- **WHEN** envia `POST /api/v1/locais` informando campus, bloco/prédio e andar
- **THEN** o sistema valida unicidade e persiste o registro retornando o ID do local

### Requirement: Cadastro de Ambientes com Atributos Operacionais
O sistema SHALL registrar ambientes físicos com identificador único, nome, tipo (`EnvironmentType`), localização, capacidade máxima e criticidade (`COMMON`, `CONTROLLED`, `RESTRICTED`).

#### Scenario: Cadastro de laboratório restrito
- **GIVEN** um administrador autenticado cadastrando um novo espaço
- **WHEN** envia `POST /api/v1/ambientes` com criticidade `RESTRICTED` e tipo `LABORATORY`
- **THEN** o sistema salva o ambiente e habilita a configuração de políticas de antecedência, qualificações exigidas e buffers

### Requirement: Políticas e Restrições de Ambientes
O sistema SHALL permitir configurar tempos de buffer de preparação/limpeza padrão (`lead_time_min`, `buffer_before_minutes`, `buffer_after_minutes`), restrições de horários e requisitos específicos para cada ambiente.

#### Scenario: Definição de buffer de limpeza pós-reserva
- **GIVEN** um ambiente de auditório que exige 30 minutos de limpeza
- **WHEN** o administrador atualiza as políticas do ambiente configurando `buffer_after_minutes = 30`
- **THEN** o motor de agendamento passa a bloquear automaticamente esse intervalo após qualquer reserva aprovada
