# Unidades Organizacionais e Qualificações

## Purpose
Estruturar as unidades organizacionais (departamentos, faculdades, coordenações) e gerenciar as qualificações e certificações técnicas dos usuários necessárias para liberação de reservas em ambientes controlados ou de alto risco.

## Requirements

### Requirement: Gestão de Unidades Organizacionais
O sistema SHALL permitir o gerenciamento de unidades organizacionais às quais os usuários e ambientes pertencem, com prioridades de agendamento e limites de cotas.

#### Scenario: Cadastro de novo departamento acadêmico
- **GIVEN** um administrador autenticado
- **WHEN** envia `POST /api/v1/unidades-organizacionais` informando nome, sigla e código
- **THEN** a unidade é criada e disponibilizada para associação a usuários e espaços físicos

### Requirement: Gestão de Qualificações e Treinamentos
O sistema SHALL permitir o cadastro de qualificações formais (ex: Treinamento de Biossegurança, Operação de Laser, Manuseio de Reagentes) com prazo de validade.

#### Scenario: Atribuição de certificação a usuário
- **GIVEN** um usuário que concluiu um curso de segurança em laboratório
- **WHEN** o administrador ou técnico registra a qualificação com data de validade futura em `POST /api/v1/qualificacoes/usuarios`
- **THEN** o usuário torna-se elegível para solicitar ambientes que exijam essa qualificação

### Requirement: Validação de Habilitação na Reserva
O sistema SHALL validar automaticamente se o solicitante/responsável possui todas as qualificações ativas exigidas pelo ambiente antes de permitir a confirmação da reserva.

#### Scenario: Usuário sem certificação tenta reservar laboratório químico
- **GIVEN** um ambiente que exige qualificação "Segurança Química Nível 2"
- **WHEN** um aluno sem essa qualificação tenta submeter a reserva
- **THEN** o sistema bloqueia a submissão e informa quais qualificações obrigatórias estão ausentes
