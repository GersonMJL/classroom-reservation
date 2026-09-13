## Purpose
Oferecer uma experiência de página inicial acolhedora, com identidade visual forte, ações rápidas para reserva de salas e navegação adaptada ao papel do usuário conectado.

## ADDED Requirements

### Requirement: Hero Section e Ações Rápidas na Home
A página inicial SHALL apresentar um banner acolhedor com identidade visual terrosa, exibindo saudação contextual ao usuário, status das reservas do dia e cartões de ação rápida para nova solicitação e consulta de disponibilidade.

#### Scenario: Visualização da home por usuário autenticado
- **WHEN** um usuário autenticado acessa a rota `/` (Home)
- **THEN** a tela exibe o Hero com o nome do usuário, botões de ação rápida e resumo visual dos seus agendamentos ativos

### Requirement: Painel de Contas de Demonstração para Testes
A interface SHALL disponibilizar um seletor visual de contas de demonstração (`ADMIN`, `PROFESSOR`, `STUDENT`, `TECHNICIAN`) facilitando a alternância e o preenchimento automático das credenciais durante a avaliação do sistema.

#### Scenario: Preenchimento automático de credenciais de aluno
- **WHEN** um visitante clica no botão "Acessar como Aluno" no seletor de demonstração
- **THEN** os campos de e-mail e senha são preenchidos com `aluno@reservas.com` e a senha correspondente para login imediato
