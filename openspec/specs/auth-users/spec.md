# Autenticação e Gestão de Usuários

## Purpose
Prover mecanismos seguros de autenticação, geração de tokens JWT com hash Argon2 e gerenciamento de perfis de usuários (Admin, Professor, Aluno, Técnico de Suporte, Operador e Externo) no sistema de reservas.

## Requirements

### Requirement: Autenticação de Usuário e Emissão de Tokens
O sistema SHALL permitir o login de usuários cadastrados fornecendo e-mail e senha, retornando tokens de acesso (access token) e atualização (refresh token) assinados em formato JWT.

#### Scenario: Login com credenciais válidas
- **GIVEN** um usuário ativo no banco de dados com e-mail `admin@exemplo.com` e senha cadastrada
- **WHEN** o usuário envia uma requisição `POST /api/v1/auth/login` com as credenciais corretas
- **THEN** o sistema retorna código HTTP 200 contendo o token JWT de acesso, tipo de token Bearer e dados resumidos do usuário

#### Scenario: Falha de autenticação por credenciais inválidas
- **GIVEN** um usuário tentando se autenticar no sistema
- **WHEN** o usuário envia senha incorreta ou e-mail inexistente
- **THEN** o sistema retorna código HTTP 401 (Unauthorized) com mensagem informativa em pt-BR

### Requirement: Controle de Acesso Baseado em Papéis (RBAC)
O sistema SHALL aplicar guards de autorização baseados no papel (`Role`) do usuário para proteger rotas administrativas, operacionais e de solicitação comum.

#### Scenario: Usuário comum tenta acessar rota administrativa
- **GIVEN** um usuário autenticado com perfil `STUDENT` ou `PROFESSOR`
- **WHEN** o usuário tenta executar uma mutação restrita a administradores (ex: exclusão de unidade organizacional)
- **THEN** o sistema retorna código HTTP 403 (Forbidden)

### Requirement: Gestão de Cadastro de Usuários
O sistema SHALL permitir que administradores criem, consultem, atualizem e desativem usuários no sistema.

#### Scenario: Criação de novo usuário com hash de senha
- **GIVEN** um administrador autenticado
- **WHEN** envia `POST /api/v1/usuarios` com nome, e-mail único, papel e senha
- **THEN** o sistema persiste o registro criptografando a senha com Argon2 e retorna o ID do usuário criado

### Requirement: Contas Padrão de Demonstração e Seeder
O sistema SHALL disponibilizar contas de demonstração populadas por seeder/migração com e-mails e senhas padronizados para os papéis `ADMIN`, `PROFESSOR`, `STUDENT` e `TECHNICIAN`.

#### Scenario: Login com conta padrão de administrador
- **GIVEN** a base de dados populada com dados de demonstração
- **WHEN** o usuário envia as credenciais de seed `admin@reservas.com` e senha `admin123`
- **THEN** o sistema autentica com sucesso e concede permissões de nível `ADMIN`

#### Scenario: Login com conta padrão de aluno
- **GIVEN** a base de dados populada com dados de demonstração
- **WHEN** o usuário envia as credenciais de seed `aluno@reservas.com` e senha `aluno123`
- **THEN** o sistema autentica com sucesso atribuindo o papel `STUDENT`

### Requirement: Restrição de Acesso para Usuários Comuns (Alunos)
O sistema SHALL ocultar do menu de navegação e bloquear o acesso a rotas administrativas de gestão para usuários comuns (`STUDENT`), direcionando seu fluxo exclusivamente para consulta e solicitação de salas.

#### Scenario: Aluno acessa menu lateral
- **GIVEN** um usuário autenticado com papel `STUDENT`
- **WHEN** navega pela aplicação
- **THEN** o menu lateral exibe apenas "Início", "Salas e Ambientes" e "Minhas Reservas", ocultando módulos administrativos de auditoria, governança e gestão de unidades
